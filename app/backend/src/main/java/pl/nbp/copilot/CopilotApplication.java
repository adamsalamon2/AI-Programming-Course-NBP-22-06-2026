package pl.nbp.copilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Hardware Service Decision Copilot backend.
 *
 * <p>Spring Boot 4.1.x application using Spring MVC with virtual threads
 * ({@code spring.threads.virtual.enabled=true}). The blocking OpenAI Java SDK
 * is intentionally used with MVC rather than WebFlux — see ADR-000 §8 and ADR-001 §6.</p>
 */
@SpringBootApplication
@EnableScheduling
public class CopilotApplication {

    /**
     * Starts the Spring Boot application.
     *
     * @param args command-line arguments (passed to {@link SpringApplication#run})
     */
    public static void main(String[] args) {
        SpringApplication.run(CopilotApplication.class, args);
    }
}
