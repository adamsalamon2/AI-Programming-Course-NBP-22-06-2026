package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.RequestOptions;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessage;
import com.openai.services.blocking.ChatService;
import com.openai.services.blocking.chat.ChatCompletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pl.nbp.copilot.config.OpenRouterProperties;
import pl.nbp.copilot.policy.PolicyLoader;
import pl.nbp.copilot.web.model.RequestType;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("VisionAnalyzer")
class VisionAnalyzerIntegrationTest {

    private ChatCompletionService mockCompletionService;
    private VisionAnalyzer visionAnalyzer;

    @BeforeEach
    void setup() {
        var mockClient = mock(OpenAIClient.class);
        var mockChatService = mock(ChatService.class);
        mockCompletionService = mock(ChatCompletionService.class);

        when(mockClient.chat()).thenReturn(mockChatService);
        when(mockChatService.completions()).thenReturn(mockCompletionService);

        var policyLoader = mock(PolicyLoader.class);
        when(policyLoader.getReturnPolicy()).thenReturn("polityka zwrotów");
        when(policyLoader.getComplaintPolicy()).thenReturn("polityka reklamacji");

        var properties = new OpenRouterProperties("test-key", "http://localhost", "gpt-text", "gpt-vision");
        var promptFactory = new PromptFactory(policyLoader);
        visionAnalyzer = new VisionAnalyzer(mockClient, properties, promptFactory);
    }

    private void setupCompletionResponse(String content) {
        var mockCompletion = mock(ChatCompletion.class);
        var mockChoice = mock(ChatCompletion.Choice.class);
        var mockMessage = mock(ChatCompletionMessage.class);

        lenient().when(mockMessage.content()).thenReturn(Optional.of(content));
        lenient().when(mockChoice.message()).thenReturn(mockMessage);
        lenient().when(mockCompletion.choices()).thenReturn(List.of(mockChoice));
        // Używamy dwuargumentowego create(params, requestOptions) — z RequestOptions z timeoutem (BUG-B fix)
        when(mockCompletionService.create(any(ChatCompletionCreateParams.class), any(RequestOptions.class)))
                .thenReturn(mockCompletion);
    }

    @Test
    @DisplayName("używa modelu wizyjnego (vision) skonfigurowanego jako String slug")
    void usesVisionModelSlug() {
        setupCompletionResponse("Analiza obrazu");

        visionAnalyzer.analyze("dGVzdA==", RequestType.RETURN);

        var captor = ArgumentCaptor.forClass(ChatCompletionCreateParams.class);
        verify(mockCompletionService).create(captor.capture(), any(RequestOptions.class));
        assertThat(captor.getValue().model().asString()).isEqualTo("gpt-vision");
    }

    @Test
    @DisplayName("żądanie zawiera content part z data URL obrazu JPEG base64")
    void requestContainsImageDataUrl() {
        setupCompletionResponse("Wynik analizy");

        String testBase64 = Base64.getEncoder().encodeToString("fake-image".getBytes());
        visionAnalyzer.analyze(testBase64, RequestType.COMPLAINT);

        var captor = ArgumentCaptor.forClass(ChatCompletionCreateParams.class);
        verify(mockCompletionService).create(captor.capture(), any(RequestOptions.class));
        var params = captor.getValue();

        var messages = params.messages();
        var hasImagePart = messages.stream()
                .filter(m -> m.user().isPresent())
                .anyMatch(m -> {
                    var content = m.user().get().content();
                    return content.isArrayOfContentParts() &&
                           content.asArrayOfContentParts().stream()
                                   .anyMatch(p -> p.isImageUrl() &&
                                           p.asImageUrl().imageUrl().url()
                                                   .startsWith("data:image/jpeg;base64,"));
                });

        assertThat(hasImagePart).as("Wiadomość powinna zawierać content part z data URL obrazu JPEG").isTrue();
    }

    @Test
    @DisplayName("zwraca tekst analizy z odpowiedzi modelu")
    void returnsAnalysisText() {
        setupCompletionResponse("Brak śladów użytkowania na urządzeniu");

        String result = visionAnalyzer.analyze("dGVzdA==", RequestType.RETURN);

        assertThat(result).isEqualTo("Brak śladów użytkowania na urządzeniu");
    }

    /**
     * BUG-B regression: wywołanie modelu wizyjnego musi być chronione timeoutem,
     * żeby zablokowane żądanie (np. brak odpowiedzi OpenRouter) nie wiesiło wątku w nieskończoność.
     *
     * <p>Weryfikujemy, że {@code create(params, requestOptions)} jest wywoływane z {@link RequestOptions}
     * zawierającym niepusty timeout żądania (≥ 1 sekunda), co deleguje limit czasu do warstwy OkHttp.</p>
     */
    @Test
    @DisplayName("BUG-B: wywołanie modelu wizyjnego używa RequestOptions z timeoutem żądania")
    void visionCall_usesRequestOptionsWithTimeout() {
        setupCompletionResponse("analiza");

        visionAnalyzer.analyze("dGVzdA==", RequestType.RETURN);

        var requestOptionsCaptor = ArgumentCaptor.forClass(RequestOptions.class);
        verify(mockCompletionService).create(any(ChatCompletionCreateParams.class), requestOptionsCaptor.capture());

        RequestOptions options = requestOptionsCaptor.getValue();
        assertThat(options.getTimeout())
                .as("RequestOptions musi zawierać timeout")
                .isNotNull();

        Duration requestTimeout = options.getTimeout().request();
        assertThat(requestTimeout)
                .as("Timeout żądania musi być skonfigurowany (minimum 1 sekunda)")
                .isNotNull()
                .isGreaterThanOrEqualTo(Duration.ofSeconds(1));
    }
}
