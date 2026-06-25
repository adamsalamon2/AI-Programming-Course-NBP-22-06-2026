package pl.nbp.copilot.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessage;
import com.openai.services.blocking.ChatService;
import com.openai.services.blocking.chat.ChatCompletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.ai.model.Verdict;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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
        decisionEngine = new DecisionEngine(mockClient, properties, new ObjectMapper());
    }

    private void setupCompletionResponse(String jsonContent) {
        var mockCompletion = mock(ChatCompletion.class);
        var mockChoice = mock(ChatCompletion.Choice.class);
        var mockMessage = mock(ChatCompletionMessage.class);

        lenient().when(mockMessage.content()).thenReturn(Optional.of(jsonContent));
        lenient().when(mockChoice.message()).thenReturn(mockMessage);
        lenient().when(mockCompletion.choices()).thenReturn(List.of(mockChoice));
        when(mockCompletionService.create(any(ChatCompletionCreateParams.class))).thenReturn(mockCompletion);
    }

    @Test
    @DisplayName("APPROVE: deserializacja i werdykt")
    void approveVerdictDeserialized() {
        setupCompletionResponse("""
                {"verdict":"APPROVE","justification":"Produkt w stanie nieużywanym, zakupiony 3 dni temu.",
                 "nextSteps":"Proszę skontaktować się z działem obsługi klienta.",
                 "disclaimer":"Niniejsza decyzja ma charakter wyłącznie doradczy i nie jest wiążącą decyzją firmy.",
                 "missingInfo":null}
                """);

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.APPROVE);
        assertThat(decision.getJustification()).isNotBlank();
        assertThat(decision.getDisclaimer()).isNotBlank();
        assertThat(decision.getMissingInfo()).isNull();
    }

    @Test
    @DisplayName("REJECT: deserializacja i werdykt")
    void rejectVerdictDeserialized() {
        setupCompletionResponse("""
                {"verdict":"REJECT","justification":"Uszkodzenie mechaniczne wskazuje na nieautoryzowaną naprawę.",
                 "nextSteps":"Możliwa płatna naprawa. Proszę odwiedzić autoryzowany serwis.",
                 "disclaimer":"Niniejsza decyzja ma charakter wyłącznie doradczy.",
                 "missingInfo":null}
                """);

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.REJECT);
        assertThat(decision.getJustification()).isNotBlank();
        assertThat(decision.getDisclaimer()).isNotBlank();
    }

    @Test
    @DisplayName("NEEDS_REVIEW: deserializacja i niepuste missingInfo")
    void needsReviewHasNonEmptyMissingInfo() {
        setupCompletionResponse("""
                {"verdict":"NEEDS_REVIEW","justification":"Zdjęcie jest niewyraźne.",
                 "nextSteps":"Proszę przesłać wyraźniejsze zdjęcie.",
                 "disclaimer":"Niniejsza decyzja ma charakter wyłącznie doradczy.",
                 "missingInfo":"Brak wyraźnego zdjęcia pokazującego uszkodzenie ekranu."}
                """);

        Decision decision = decisionEngine.decide(List.of());

        assertThat(decision.getVerdict()).isEqualTo(Verdict.NEEDS_REVIEW);
        assertThat(decision.getMissingInfo()).isNotBlank();
    }

    @Test
    @DisplayName("używa modelu tekstowego (text model) jako String slug")
    void usesTextModelSlug() {
        setupCompletionResponse("""
                {"verdict":"APPROVE","justification":"OK","nextSteps":"OK",
                 "disclaimer":"Doradcze.","missingInfo":null}
                """);

        decisionEngine.decide(List.of());

        var captor = ArgumentCaptor.forClass(ChatCompletionCreateParams.class);
        verify(mockCompletionService).create(captor.capture());
        assertThat(captor.getValue().model().asString()).isEqualTo("gpt-text");
    }
}
