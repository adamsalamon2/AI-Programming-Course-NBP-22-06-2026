package pl.nbp.copilot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Konfiguracja CORS dla API backendu.
 *
 * <p>Zezwala na żądania z skonfigurowanego originu Angular (domyślnie
 * {@code http://localhost:4200}) do wszystkich ścieżek {@code /api/**}.
 * Origin jest konfigurowany przez {@code app.cors.allowed-origin} (ADR-001 §5, TAC-001-08).</p>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String allowedOrigin;

    public CorsConfig(@Value("${app.cors.allowed-origin:http://localhost:4200}") String allowedOrigin) {
        this.allowedOrigin = allowedOrigin;
    }

    /**
     * Rejestruje CORS dla ścieżki {@code /api/**}.
     *
     * <p>Zezwala na: GET, POST, OPTIONS.
     * Dozwolone nagłówki: Content-Type, Accept.
     * Credentials: {@code false} (brak sesji HTTP).</p>
     *
     * @param registry rejestr konfiguracji CORS
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigin)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
