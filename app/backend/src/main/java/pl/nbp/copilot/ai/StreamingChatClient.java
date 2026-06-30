package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletionChunk;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessageParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.io.IOException;
import java.util.List;

/**
 * Wywołuje model LLM w trybie strumieniowania i wysyła tokeny przez SSE.
 */
@Component
public class StreamingChatClient {

    private static final Logger log = LoggerFactory.getLogger(StreamingChatClient.class);

    private final OpenAIClient client;
    private final OpenRouterProperties properties;

    public StreamingChatClient(OpenAIClient client, OpenRouterProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    /**
     * Uruchamia strumieniowe wywołanie LLM, wysyła tokeny do emitera SSE
     * i zwraca pełną odpowiedź asystenta do zapisania w konwersacji.
     *
     * <p>Po zakończeniu strumienia wysyłany jest terminal event {@code complete}.
     * W przypadku błędu mid-stream wysyłany jest event {@code error}
     * (bez fabrykowania treści; dotychczasowe tokeny pozostają).</p>
     *
     * @param messages lista wiadomości (system + historia + nowe pytanie)
     * @param emitter  emiter SSE do wysyłania fragmentów
     * @return pełna treść odpowiedzi asystenta złożona z odebranych tokenów
     */
    public String stream(List<ChatCompletionMessageParam> messages, SseEmitter emitter) {
        var params = ChatCompletionCreateParams.builder()
                .model(properties.textModel())
                .messages(messages)
                .build();

        var fullResponse = new StringBuilder();

        try (StreamResponse<ChatCompletionChunk> streamResponse = client.chat().completions().createStreaming(params)) {
            streamResponse.stream().forEach(chunk -> {
                var choices = chunk.choices();
                if (choices.isEmpty()) return;
                var delta = choices.get(0).delta();
                var content = delta.content().orElse(null);
                if (content != null && !content.isEmpty()) {
                    fullResponse.append(content);
                    try {
                        // Specyfikacja SSE: parser klienta usuwa dokładnie jedną wiodącą spację
                        // z wartości pola data. Spring pisze "data:<content>" (bez spacji po dwukropku),
                        // więc wiodąca spacja tokenu (np. " mogę") byłaby tą jedyną spacją i zostałaby
                        // skonsumowana przez parser. Rozwiązanie: poprzedzamy wartość jedną spacją,
                        // którą parser usunie, zachowując oryginalną zawartość tokenu.
                        emitter.send(SseEmitter.event().data(" " + content));
                    } catch (IOException ex) {
                        throw new java.io.UncheckedIOException(ex);
                    }
                }
            });
            emitter.send(SseEmitter.event().name("complete").data("[DONE]"));
            emitter.complete();
        } catch (IOException e) {
            log.error("Błąd wysyłania SSE", e);
            trySendError(emitter, "Błąd wysyłania odpowiedzi");
        } catch (Exception e) {
            log.error("Błąd strumieniowania LLM", e);
            trySendError(emitter, "Błąd komunikacji z modelem AI");
        }

        return fullResponse.toString();
    }

    private void trySendError(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().name("error").data(message));
            emitter.complete();
        } catch (IOException ioEx) {
            log.warn("Nie można wysłać eventu error przez SSE", ioEx);
            emitter.completeWithError(ioEx);
        }
    }
}
