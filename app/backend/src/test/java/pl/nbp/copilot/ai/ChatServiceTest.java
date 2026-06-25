package pl.nbp.copilot.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.session.CaseSummaryData;
import pl.nbp.copilot.session.ChatMessage;
import pl.nbp.copilot.session.Conversation;
import pl.nbp.copilot.session.ConversationStore;
import pl.nbp.copilot.session.MessageRole;
import pl.nbp.copilot.session.SessionNotFoundException;
import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.RequestType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService")
class ChatServiceTest {

    @Mock
    private ConversationStore conversationStore;
    @Mock
    private StreamingChatClient streamingChatClient;

    private ChatService chatService;

    private static final Executor DIRECT_EXECUTOR = Runnable::run;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(conversationStore, streamingChatClient, DIRECT_EXECUTOR);
    }

    private Conversation sampleConversation(String sessionId) {
        var summary = new CaseSummaryData(RequestType.RETURN, Category.LAPTOPY, "Dell XPS 13",
                java.time.LocalDate.of(2025, 6, 1));
        return new Conversation(sessionId, summary, "Analiza: dobry stan", List.of(), Instant.now());
    }

    @Test
    @DisplayName("rzuca SessionNotFoundException gdy sesja nie istnieje")
    void chat_unknownSession_throwsSessionNotFoundException() {
        when(conversationStore.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.chat("unknown", "Pytanie"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    @DisplayName("zwraca SseEmitter dla istniejącej sesji")
    void chat_existingSession_returnsSseEmitter() {
        var conversation = sampleConversation("sess-chat");
        when(conversationStore.findById("sess-chat")).thenReturn(Optional.of(conversation));
        when(streamingChatClient.stream(any(), any())).thenReturn("Odpowiedź asystenta");

        SseEmitter emitter = chatService.chat("sess-chat", "Czy mogę zwrócić laptopa?");

        assertThat(emitter).isNotNull();
    }

    @Test
    @DisplayName("wiadomość użytkownika jest dodawana do konwersacji")
    void chat_userMessageAddedToConversation() {
        var conversation = sampleConversation("sess-msg");
        when(conversationStore.findById("sess-msg")).thenReturn(Optional.of(conversation));
        when(streamingChatClient.stream(any(), any())).thenReturn("");

        chatService.chat("sess-msg", "Moje pytanie");

        var messages = conversation.getMessages();
        assertThat(messages).anyMatch(m -> m.role() == MessageRole.USER && m.content().equals("Moje pytanie"));
    }

    @Test
    @DisplayName("wywołuje StreamingChatClient z historią konwersacji")
    void chat_invokesStreamingClient() {
        var conversation = sampleConversation("sess-stream");
        conversation.addMessage(new ChatMessage(MessageRole.ASSISTANT, "Witaj! Jak mogę pomóc?"));
        when(conversationStore.findById("sess-stream")).thenReturn(Optional.of(conversation));
        when(streamingChatClient.stream(any(), any())).thenReturn("Kolejna odpowiedź");

        chatService.chat("sess-stream", "Dalsze pytanie");

        verify(streamingChatClient).stream(anyList(), any(SseEmitter.class));
    }

    @Test
    @DisplayName("odpowiedź asystenta jest zapisywana w konwersacji po zakończeniu strumienia")
    void chat_assistantReplyAppendedToConversation() {
        var conversation = sampleConversation("sess-append");
        when(conversationStore.findById("sess-append")).thenReturn(Optional.of(conversation));
        when(streamingChatClient.stream(any(), any())).thenReturn("Jestem asystentem AI.");

        chatService.chat("sess-append", "Pytanie testowe");

        var messages = conversation.getMessages();
        assertThat(messages).anyMatch(m ->
                m.role() == MessageRole.ASSISTANT && m.content().equals("Jestem asystentem AI."));
    }

    @Test
    @DisplayName("pełna historia konwersacji przekazywana jest do StreamingChatClient")
    void chat_fullContextSentToStreamingClient() {
        var conversation = sampleConversation("sess-ctx");
        conversation.addMessage(new ChatMessage(MessageRole.USER, "Pierwsze pytanie"));
        conversation.addMessage(new ChatMessage(MessageRole.ASSISTANT, "Pierwsza odpowiedź"));
        when(conversationStore.findById("sess-ctx")).thenReturn(Optional.of(conversation));
        when(streamingChatClient.stream(any(), any())).thenReturn("Nowa odpowiedź");

        chatService.chat("sess-ctx", "Drugie pytanie");

        // Verify that full context was sent: system + 2 prior messages + new user message = 4
        verify(streamingChatClient).stream(argThat(msgs -> msgs.size() >= 4), any(SseEmitter.class));
    }
}
