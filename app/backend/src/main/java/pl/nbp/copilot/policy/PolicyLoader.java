package pl.nbp.copilot.policy;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Ładuje pliki polityk zwrotów i reklamacji z classpath przy starcie aplikacji.
 *
 * <p>Pobiera teksty z {@code classpath:policies/polityka-zwrotow.md} i
 * {@code classpath:policies/polityka-reklamacji.md}. Brak któregokolwiek pliku
 * powoduje natychmiastowy błąd startowy ({@link IllegalStateException}).</p>
 */
@Component
public class PolicyLoader {

    private static final Logger log = LoggerFactory.getLogger(PolicyLoader.class);

    private static final String RETURN_POLICY_PATH = "classpath:policies/polityka-zwrotow.md";
    private static final String COMPLAINT_POLICY_PATH = "classpath:policies/polityka-reklamacji.md";

    private final ResourceLoader resourceLoader;
    private String returnPolicy;
    private String complaintPolicy;

    public PolicyLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() {
        this.returnPolicy = loadPolicy(RETURN_POLICY_PATH, "polityki zwrotów");
        this.complaintPolicy = loadPolicy(COMPLAINT_POLICY_PATH, "polityki reklamacji");
        log.info("Załadowano polityki: zwrotów ({} znaków), reklamacji ({} znaków)",
                returnPolicy.length(), complaintPolicy.length());
    }

    private String loadPolicy(String path, String description) {
        var resource = resourceLoader.getResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException(
                    "Brak wymaganego pliku polityki: " + description + " (" + path + ")");
        }
        try {
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Nie można wczytać pliku polityki: " + description + " (" + path + ")", e);
        }
    }

    /** Zwraca tekst polityki zwrotów. */
    public String getReturnPolicy() {
        return returnPolicy;
    }

    /** Zwraca tekst polityki reklamacji. */
    public String getComplaintPolicy() {
        return complaintPolicy;
    }
}
