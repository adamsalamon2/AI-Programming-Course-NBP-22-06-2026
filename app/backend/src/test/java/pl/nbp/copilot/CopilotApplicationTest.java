package pl.nbp.copilot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test that verifies the Spring application context loads without errors.
 *
 * <p>This test uses {@code webEnvironment = NONE} to skip starting Tomcat and keep
 * startup fast; it is not testing HTTP — just that all beans wire up cleanly.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("CopilotApplication context loads")
class CopilotApplicationTest {

    @Test
    @DisplayName("Spring context starts without throwing")
    void contextLoads() {
        // If this test runs without exception, the application context is valid.
    }
}
