package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.core.RequestOptions;
import com.openai.models.chat.completions.StructuredChatCompletion;
import com.openai.models.chat.completions.StructuredChatCompletionCreateParams;
import com.openai.models.chat.completions.StructuredChatCompletionMessage;
import com.openai.services.blocking.ChatService;
import com.openai.services.blocking.chat.ChatCompletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.ai.model.Verdict;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("DecisionEngine")
class DecisionEngineIntegrationTest {

    private ChatCompletionService mockCompletionService;
    private DecisionEngine decisionEngine;

    @BeforeEach
    void setup() {
        var mockClient = mock(OpenAIClient.class);
        var mockChatService = mock(ChatService.class);
        mockCompletionService = mock(ChatCompletionService.class);

        when(mockClient.chat()).thenReturn(mockChatService);
        when(mockChatService.completions()).thenReturn(mockCompletionService);

        var properties = new OpenRouterProperties("test-key", "http://localhost", "gpt-text", "gpt-vision");
        decisionEngine = new DecisionEngine(mockClient, properties);
    }

    @SuppressWarnings("unchecked")
    private void setupStructuredResponse(Decision decision) {
        var mockMessage = mock(StructuredChatCompletionMessage.class);
        var mockChoice = mock(StructuredChatCompletion.Choice.class);
        var mockCompletion = mock(StructuredChatCompletion.class);

        lenient().when(mockMessage.content()).thenReturn(Optional.of(decision));
        lenient().when(mockChoice.message()).thenReturn(mockMessage);
        lenient().when(mockCompletion.choices()).thenReturn(List.of(mockChoice));
        // Używamy dwuargumentowego create(params, requestOptions) — z RequestOptions z timeoutem (BUG-B fix)
        when(mockCompletionService.create(any(StructuredChatCompletionCreateParams.class), any(RequestOptions.class)))
                .thenReturn(mockCompletion);
    }

    @Test
    @DisplayName("APPROVE: deserializacja i werdykt")
    void approveVerdictDeserialized() {
        setupStructuredResponse(new Decision(
                Verdict.APPROVE,
                "Produkt w stanie nieużywanym, zakupiony 3 dni temu.",
                "Proszę skontaktować się z działem obsługi klienta.",
                "Niniejsza decyzja ma charakter wyłącznie doradczy i nie jest wiążącą decyzją firmy.",
                null));

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.APPROVE);
        assertThat(decision.getJustification()).isNotBlank();
        assertThat(decision.getDisclaimer()).isNotBlank();
        assertThat(decision.getMissingInfo()).isNull();
    }

    @Test
    @DisplayName("REJECT: deserializacja i werdykt")
    void rejectVerdictDeserialized() {
        setupStructuredResponse(new Decision(
                Verdict.REJECT,
                "Uszkodzenie mechaniczne wskazuje na nieautoryzowaną naprawę.",
                "Możliwa płatna naprawa. Proszę odwiedzić autoryzowany serwis.",
                "Niniejsza decyzja ma charakter wyłącznie doradczy.",
                null));

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.REJECT);
        assertThat(decision.getJustification()).isNotBlank();
        assertThat(decision.getDisclaimer()).isNotBlank();
    }

    @Test
    @DisplayName("NEEDS_REVIEW: deserializacja i niepuste missingInfo")
    void needsReviewHasNonEmptyMissingInfo() {
        setupStructuredResponse(new Decision(
                Verdict.NEEDS_REVIEW,
                "Zdjęcie jest niewyraźne.",
                "Proszę przesłać wyraźniejsze zdjęcie.",
                "Niniejsza decyzja ma charakter wyłącznie doradczy.",
                "Brak wyraźnego zdjęcia pokazującego uszkodzenie ekranu."));

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.NEEDS_REVIEW);
        assertThat(decision.getMissingInfo()).isNotBlank();
    }

    @Test
    @DisplayName("używa modelu tekstowego (text model) jako String slug")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void usesTextModelSlug() {
        setupStructuredResponse(new Decision(
                Verdict.APPROVE,
                "OK", "OK",
                "Doradcze.",
                null));

        decisionEngine.decide(List.of());

        var captor = ArgumentCaptor.forClass(StructuredChatCompletionCreateParams.class);
        verify(mockCompletionService).create(captor.capture(), any(RequestOptions.class));
        assertThat(captor.getValue().rawParams().model().asString()).isEqualTo("gpt-text");
    }

    /**
     * BUG-B regression: wywołanie modelu decyzyjnego musi być chronione timeoutem,
     * żeby zablokowane żądanie nie wiesiło wątku w nieskończoność.
     *
     * <p>Weryfikujemy, że {@code create(params, requestOptions)} jest wywoływane z {@link RequestOptions}
     * zawierającym niepusty timeout żądania (≥ 1 sekunda).</p>
     */
    @Test
    @DisplayName("BUG-B: wywołanie modelu decyzyjnego używa RequestOptions z timeoutem żądania")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void decisionCall_usesRequestOptionsWithTimeout() {
        setupStructuredResponse(new Decision(
                Verdict.APPROVE,
                "OK", "OK",
                "Doradcze.",
                null));

        decisionEngine.decide(List.of());

        var requestOptionsCaptor = ArgumentCaptor.forClass(RequestOptions.class);
        verify(mockCompletionService).create(any(StructuredChatCompletionCreateParams.class), requestOptionsCaptor.capture());

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
