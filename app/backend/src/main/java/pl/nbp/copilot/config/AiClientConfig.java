package pl.nbp.copilot.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Konfiguracja klienta OpenAI SDK wskazującego na OpenRouter.
 *
 * <p>Buduje jeden bean {@link OpenAIClient} z kluczem API, bazowym URL i opcjonalnymi nagłówkami
 * atrybucji OpenRouter ({@code HTTP-Referer}, {@code X-Title}).
 * Model jest przekazywany jako String — nigdy jako {@code ChatModel} enum (ADR-002).</p>
 */
@Configuration
@EnableConfigurationProperties({OpenRouterProperties.class, AppProperties.class})
public class AiClientConfig {

    @Bean
    public OpenAIClient openAIClient(OpenRouterProperties openRouterProperties,
                                     AppProperties appProperties) {
        var builder = OpenAIOkHttpClient.builder()
                .apiKey(openRouterProperties.apiKey())
                .baseUrl(openRouterProperties.baseUrl());

        String httpReferer = appProperties.httpReferer();
        if (httpReferer != null && !httpReferer.isBlank()) {
            builder.putHeader("HTTP-Referer", httpReferer);
        }

        String title = appProperties.title();
        if (title != null && !title.isBlank()) {
            builder.putHeader("X-Title", title);
        }

        return builder.build();
    }

    @Bean
    public Executor virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
