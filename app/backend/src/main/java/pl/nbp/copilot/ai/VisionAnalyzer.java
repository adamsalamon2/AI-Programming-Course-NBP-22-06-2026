package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.RequestOptions;
import com.openai.core.Timeout;
import com.openai.models.chat.completions.ChatCompletionContentPart;
import com.openai.models.chat.completions.ChatCompletionContentPartImage;
import com.openai.models.chat.completions.ChatCompletionContentPartText;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionUserMessageParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pl.nbp.copilot.config.OpenRouterProperties;
import pl.nbp.copilot.web.model.RequestType;

import java.time.Duration;
import java.util.List;

/**
 * Wykonuje wizyjną analizę obrazu urządzenia przy użyciu modelu multimodalnego.
 *
 * <p>Wysyła obraz jako data URL (JPEG base64) razem z instrukcją analizy
 * dopasowaną do typu zgłoszenia (zwrot vs reklamacja).</p>
 *
 * <p>Wywołanie blokuje wątek przez maksymalnie {@value #REQUEST_TIMEOUT_SECONDS} sekund
 * ({@link #REQUEST_OPTIONS}). Przekroczenie limitu skutkuje wyjątkiem obsługiwanym
 * przez {@code GlobalExceptionHandler} — klient otrzymuje odpowiedź 502, nie wisi w nieskończoność.</p>
 */
@Service
public class VisionAnalyzer {

    /** Maksymalny czas oczekiwania na odpowiedź modelu wizyjnego. */
    static final int REQUEST_TIMEOUT_SECONDS = 60;

    private static final RequestOptions REQUEST_OPTIONS = RequestOptions.builder()
            .timeout(Timeout.builder()
                    .request(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                    .build())
            .build();

    private static final Logger log = LoggerFactory.getLogger(VisionAnalyzer.class);

    private final OpenAIClient client;
    private final OpenRouterProperties properties;
    private final PromptFactory promptFactory;

    public VisionAnalyzer(OpenAIClient client,
                          OpenRouterProperties properties,
                          PromptFactory promptFactory) {
        this.client = client;
        this.properties = properties;
        this.promptFactory = promptFactory;
    }

    /**
     * Analizuje obraz urządzenia i zwraca tekstowy opis ustaleń.
     *
     * @param imageBase64   obraz zakodowany w Base64 (JPEG, bez prefiksu data URI)
     * @param requestType   typ zgłoszenia (RETURN lub COMPLAINT)
     * @return tekstowa analiza obrazu po polsku
     */
    public String analyze(String imageBase64, RequestType requestType) {
        log.debug("Analizuję obraz dla zgłoszenia typu {}", requestType);

        String systemPrompt = promptFactory.buildAnalysisSystemPrompt(requestType);
        String dataUrl = "data:image/jpeg;base64," + imageBase64;

        var imagePart = ChatCompletionContentPart.ofImageUrl(
                ChatCompletionContentPartImage.builder()
                        .imageUrl(ChatCompletionContentPartImage.ImageUrl.builder()
                                .url(dataUrl)
                                .build())
                        .build());

        var textPart = ChatCompletionContentPart.ofText(
                ChatCompletionContentPartText.builder()
                        .text("Przeprowadź analizę zgodnie z instrukcjami.")
                        .build());

        var userMessage = ChatCompletionUserMessageParam.builder()
                .contentOfArrayOfContentParts(List.of(imagePart, textPart))
                .build();

        var params = ChatCompletionCreateParams.builder()
                .model(properties.visionModel())
                .addSystemMessage(systemPrompt)
                .addMessage(userMessage)
                .build();

        var response = client.chat().completions().create(params, REQUEST_OPTIONS);
        return response.choices().get(0).message().content().orElse("");
    }
}
