package pl.nbp.copilot.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ResponseFormatJsonObject;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessageParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.config.OpenRouterProperties;

import java.util.List;

/**
 * Wywołuje model LLM w celu podjęcia strukturalnej decyzji (APPROVE/REJECT/NEEDS_REVIEW).
 *
 * <p>Używa {@code response_format: json_object} i deserializuje odpowiedź Jacksona
 * do klasy {@link Decision}.</p>
 */
@Service
public class DecisionEngine {

    private static final Logger log = LoggerFactory.getLogger(DecisionEngine.class);

    private final OpenAIClient client;
    private final OpenRouterProperties properties;
    private final ObjectMapper objectMapper;

    public DecisionEngine(OpenAIClient client, OpenRouterProperties properties, ObjectMapper objectMapper) {
        this.client = client;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    /**
     * Podejmuje decyzję na podstawie przekazanych wiadomości.
     *
     * @param messages lista wiadomości (system + kontekst + polecenie)
     * @return ustrukturyzowana decyzja
     * @throws RuntimeException gdy model nie zwróci poprawnego JSON lub wystąpi błąd API
     */
    public Decision decide(List<ChatCompletionMessageParam> messages) {
        log.debug("Wywołuję model decyzyjny z {} wiadomościami", messages.size());

        var params = ChatCompletionCreateParams.builder()
                .model(properties.textModel())
                .messages(messages)
                .responseFormat(ResponseFormatJsonObject.builder().build())
                .build();

        var response = client.chat().completions().create(params);
        String json = response.choices().get(0).message().content()
                .orElseThrow(() -> new RuntimeException("Model nie zwrócił treści odpowiedzi"));

        try {
            return objectMapper.readValue(json, Decision.class);
        } catch (Exception e) {
            log.error("Nie można deserializować odpowiedzi modelu: {}", json, e);
            throw new RuntimeException("Nieprawidłowy format odpowiedzi modelu decyzyjnego", e);
        }
    }
}
