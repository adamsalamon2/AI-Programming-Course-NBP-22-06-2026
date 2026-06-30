package pl.nbp.copilot.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessage;
import com.openai.models.chat.completions.StructuredChatCompletion;
import com.openai.models.chat.completions.StructuredChatCompletionCreateParams;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Regression test for BUG-001: decision call must use json_schema (StructuredChatCompletionCreateParams),
 * NOT json_object (ResponseFormatJsonObject). OpenRouter/Azure rejects json_object unless the prompt
 * contains the literal word "json"; json_schema is unaffected by this restriction and also guarantees
 * the response shape.
 *
 * <p>This test fails on the broken implementation (which calls {@code create(ChatCompletionCreateParams)}
 * with {@code ResponseFormatJsonObject}) and passes after the fix (which calls
 * {@code create(StructuredChatCompletionCreateParams&lt;Decision&gt;)}).</p>
 */
@DisplayName("DecisionEngine — BUG-001 regression: musi używać json_schema, nie json_object")
class DecisionEngineResponseFormatRegressionTest {

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
    private void stubStructuredCall(Decision returnValue) {
        var mockStructuredChoice = mock(StructuredChatCompletion.Choice.class);
        var mockStructuredMessage = mock(com.openai.models.chat.completions.StructuredChatCompletionMessage.class);
        var mockStructuredCompletion = mock(StructuredChatCompletion.class);

        lenient().when(mockStructuredMessage.content()).thenReturn(Optional.of(returnValue));
        lenient().when(mockStructuredChoice.message()).thenReturn(mockStructuredMessage);
        lenient().when(mockStructuredCompletion.choices()).thenReturn(List.of(mockStructuredChoice));
        when(mockCompletionService.create(any(StructuredChatCompletionCreateParams.class)))
                .thenReturn(mockStructuredCompletion);
    }

    @Test
    @DisplayName("wywołuje create(StructuredChatCompletionCreateParams), a nie create(ChatCompletionCreateParams)")
    void usesStructuredOutputNotJsonObject() {
        var expectedDecision = new Decision(
                Verdict.APPROVE,
                "Produkt w stanie nieużywanym.",
                "Proszę skontaktować się z obsługą klienta.",
                "Decyzja ma charakter doradczy.",
                null
        );
        stubStructuredCall(expectedDecision);

        Decision result = decisionEngine.decide(List.of());

        // Verify the structured overload was called (json_schema path)
        verify(mockCompletionService).create(any(StructuredChatCompletionCreateParams.class));
        // Verify the plain json_object overload was NOT called
        verify(mockCompletionService, never()).create(any(ChatCompletionCreateParams.class));

        assertThat(result.getVerdict()).isEqualTo(Verdict.APPROVE);
    }

    @Test
    @DisplayName("parametry żądania zawierają właściwy model i wiadomości")
    @SuppressWarnings("unchecked")
    void structuredParamsContainCorrectModelAndMessages() {
        var expectedDecision = new Decision(
                Verdict.REJECT,
                "Uszkodzenie mechaniczne.",
                "Płatna naprawa.",
                "Decyzja doradcza.",
                null
        );
        stubStructuredCall(expectedDecision);

        decisionEngine.decide(List.of());

        @SuppressWarnings("rawtypes")
        var captor = ArgumentCaptor.forClass(StructuredChatCompletionCreateParams.class);
        verify(mockCompletionService).create(captor.capture());

        StructuredChatCompletionCreateParams<Decision> params = captor.getValue();
        assertThat(params.rawParams().model().asString()).isEqualTo("gpt-text");
        assertThat(params.responseType()).isEqualTo(Decision.class);
    }
}
