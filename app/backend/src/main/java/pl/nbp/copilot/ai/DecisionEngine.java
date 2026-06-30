package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.JsonSchemaLocalValidation;
import com.openai.core.RequestOptions;
import com.openai.core.Timeout;
import com.openai.models.chat.completions.ChatCompletionMessageParam;
import com.openai.models.chat.completions.StructuredChatCompletionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.time.Duration;
import java.util.List;

/**
 * Wywołuje model LLM w celu podjęcia strukturalnej decyzji (APPROVE/REJECT/NEEDS_REVIEW).
 *
 * <p>Używa trybu {@code response_format: json_schema} (structured output) poprzez
 * {@link StructuredChatCompletionCreateParams}, który wysyła pełny schemat JSON zamiast
 * samego {@code json_object}. Ta ścieżka nie jest blokowana przez warunek Azure/OpenRouter,
 * który wymaga słowa „json" w treści promptu, i gwarantuje poprawność kształtu odpowiedzi
 * bez ręcznej deserializacji.</p>
 *
 * <p>Wywołanie blokuje wątek przez maksymalnie {@value #REQUEST_TIMEOUT_SECONDS} sekund
 * ({@link #REQUEST_OPTIONS}). Przekroczenie limitu skutkuje wyjątkiem obsługiwanym
 * przez {@code GlobalExceptionHandler} — klient otrzymuje odpowiedź 502, nie wisi w nieskończoność.</p>
 */
@Service
public class DecisionEngine {

    /** Maksymalny czas oczekiwania na odpowiedź modelu decyzyjnego. */
    static final int REQUEST_TIMEOUT_SECONDS = 60;

    private static final RequestOptions REQUEST_OPTIONS = RequestOptions.builder()
            .timeout(Timeout.builder()
                    .request(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                    .build())
            .build();

    private static final Logger log = LoggerFactory.getLogger(DecisionEngine.class);

    private final OpenAIClient client;
    private final OpenRouterProperties properties;

    public DecisionEngine(OpenAIClient client, OpenRouterProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    /**
     * Podejmuje decyzję na podstawie przekazanych wiadomości.
     *
     * @param messages lista wiadomości (system + kontekst + polecenie)
     * @return ustrukturyzowana decyzja
     * @throws RuntimeException gdy model nie zwróci poprawnej odpowiedzi lub wystąpi błąd API
     */
    public Decision decide(List<ChatCompletionMessageParam> messages) {
        log.debug("Wywołuję model decyzyjny z {} wiadomościami", messages.size());

        var params = StructuredChatCompletionCreateParams.<Decision>builder()
                .model(properties.textModel())
                .messages(messages)
                .responseFormat(Decision.class, JsonSchemaLocalValidation.NO)
                .build();

        var response = client.chat().completions().create(params, REQUEST_OPTIONS);
        return response.choices().get(0).message().content()
                .orElseThrow(() -> new RuntimeException("Model nie zwrócił treści odpowiedzi"));
    }
}
