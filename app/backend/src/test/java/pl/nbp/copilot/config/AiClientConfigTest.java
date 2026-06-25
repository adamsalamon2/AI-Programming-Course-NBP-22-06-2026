package pl.nbp.copilot.config;

import com.openai.client.OpenAIClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@DisplayName("AiClientConfig")
class AiClientConfigTest {

    @Autowired
    OpenAIClient openAIClient;

    @Autowired
    OpenRouterProperties openRouterProperties;

    @Test
    @DisplayName("bean OpenAIClient jest tworzony")
    void openAiClientBeanCreated() {
        assertThat(openAIClient).isNotNull();
    }

    @Test
    @DisplayName("model tekstowy pochodzi z konfiguracji jako String")
    void textModelIsConfiguredString() {
        assertThat(openRouterProperties.textModel()).isNotBlank();
    }

    @Test
    @DisplayName("model wizyjny pochodzi z konfiguracji jako String")
    void visionModelIsConfiguredString() {
        assertThat(openRouterProperties.visionModel()).isNotBlank();
    }

    @Test
    @DisplayName("ChatModel enum nie jest używany w kodzie produkcyjnym")
    void chatModelEnumNotUsedInProductionCode() throws Exception {
        var srcDir = Path.of("src/main/java/pl/nbp/copilot");
        if (!Files.exists(srcDir)) {
            return; // skip if running from different directory
        }
        try (Stream<Path> paths = Files.walk(srcDir)) {
            var usages = paths
                    .filter(p -> p.toString().endsWith(".java"))
                    .filter(p -> {
                        try {
                            return Files.readString(p).contains("ChatModel.");
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .toList();
            assertThat(usages)
                    .as("ChatModel enum nie powinien być używany — używaj modelu jako String")
                    .isEmpty();
        }
    }
}
