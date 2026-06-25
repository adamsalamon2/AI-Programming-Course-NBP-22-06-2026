package pl.nbp.copilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Właściwości aplikacji — nagłówki atrybucji OpenRouter i konfiguracja CORS.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String httpReferer,
        String title,
        CorsProperties cors
) {
    public record CorsProperties(String allowedOrigin) {}
}
