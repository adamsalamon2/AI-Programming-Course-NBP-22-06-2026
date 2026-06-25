package pl.nbp.copilot.ai;

import com.openai.models.chat.completions.ChatCompletionMessageParam;
import com.openai.models.chat.completions.ChatCompletionSystemMessageParam;
import com.openai.models.chat.completions.ChatCompletionAssistantMessageParam;
import com.openai.models.chat.completions.ChatCompletionUserMessageParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.session.ChatMessage;
import pl.nbp.copilot.session.Conversation;
import pl.nbp.copilot.session.ConversationStore;
import pl.nbp.copilot.session.MessageRole;
import pl.nbp.copilot.session.SessionNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;

/**
 * Obsługuje strumieniowany czat wieloturowy w ramach istniejącej sesji.
 *
 * <p>Buduje pełną historię konwersacji (system prompt z kontekstem sprawy +
 * wiadomości wymiany) i przekazuje do {@link StreamingChatClient}.</p>
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final String CHAT_SYSTEM_PROMPT = """
            Jesteś pomocnym asystentem AI w serwisie obsługi klienta ds. sprzętu elektronicznego.
            Twoja rola to pomoc klientom w sprawach zwrotów i reklamacji.

            WAŻNE OGRANICZENIA:
            - Odpowiadaj WYŁĄCZNIE na pytania związane z bieżącą sprawą klienta.
            - Nie udzielasz porad prawnych ani medycznych.
            - Nie wymyślasz reguł ani faktów — opieraj się na dostarczonym kontekście.
            - Każda porada ma charakter DORADCZY i nie jest wiążącą decyzją firmy.
            - Jeśli pytanie jest niezwiązane ze sprawą, uprzejmie odmów i przekieruj.

            KONTEKST BIEŻĄCEJ SPRAWY:
            %s

            ANALIZA ZDJĘCIA URZĄDZENIA:
            %s
            """;

    private final ConversationStore conversationStore;
    private final StreamingChatClient streamingChatClient;
    private final Executor executor;

    public ChatService(ConversationStore conversationStore,
                       StreamingChatClient streamingChatClient,
                       @Qualifier("virtualThreadExecutor") Executor executor) {
        this.conversationStore = conversationStore;
        this.streamingChatClient = streamingChatClient;
        this.executor = executor;
    }

    /**
     * Przetwarza wiadomość użytkownika i zwraca emiter SSE ze strumieniowaną odpowiedzią.
     *
     * @param sessionId identyfikator sesji
     * @param userMessage treść wiadomości użytkownika
     * @return emiter SSE
     * @throws SessionNotFoundException gdy sesja nie istnieje lub wygasła
     */
    public SseEmitter chat(String sessionId, String userMessage) {
        Conversation conversation = conversationStore.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        conversation.addMessage(new ChatMessage(MessageRole.USER, userMessage));
        log.debug("Wiadomość użytkownika dodana, sesja={}", sessionId);

        List<ChatCompletionMessageParam> messages = buildMessages(conversation);
        SseEmitter emitter = new SseEmitter(120_000L);

        executor.execute(() -> {
            try {
                String assistantReply = streamingChatClient.stream(messages, emitter);
                if (!assistantReply.isBlank()) {
                    conversation.addMessage(new ChatMessage(MessageRole.ASSISTANT, assistantReply));
                    log.debug("Odpowiedź asystenta zapisana w sesji={}", sessionId);
                }
            } catch (Exception e) {
                log.error("Błąd podczas strumieniowania dla sesji={}", sessionId, e);
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private List<ChatCompletionMessageParam> buildMessages(Conversation conversation) {
        var summary = conversation.getCaseSummary();
        String caseContext = String.format(
                "Typ zgłoszenia: %s%nKategoria: %s%nModel: %s%nData zakupu: %s",
                summary.requestType().getLabel(),
                summary.category().getLabel(),
                summary.model(),
                summary.purchaseDate());

        String systemContent = CHAT_SYSTEM_PROMPT.formatted(caseContext, conversation.getImageAnalysis());

        List<ChatCompletionMessageParam> params = new ArrayList<>();
        params.add(ChatCompletionMessageParam.ofSystem(
                ChatCompletionSystemMessageParam.builder().content(systemContent).build()));

        for (ChatMessage msg : conversation.getMessages()) {
            if (msg.role() == MessageRole.USER) {
                params.add(ChatCompletionMessageParam.ofUser(
                        ChatCompletionUserMessageParam.builder().content(msg.content()).build()));
            } else if (msg.role() == MessageRole.ASSISTANT) {
                params.add(ChatCompletionMessageParam.ofAssistant(
                        ChatCompletionAssistantMessageParam.builder().content(msg.content()).build()));
            }
        }

        return params;
    }
}
