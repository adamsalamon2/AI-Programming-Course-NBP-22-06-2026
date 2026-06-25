package pl.nbp.copilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Konfiguracja połączenia z OpenRouter (gateway LLM).
 *
 * <p>Mapuje właściwości z {@code app.openrouter.*} w {@code application.yml}.</p>
 */
@ConfigurationProperties(prefix = "app.openrouter")
public record OpenRouterProperties(
        String apiKey,
        String baseUrl,
        String textModel,
        String visionModel
) {}
