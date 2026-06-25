package pl.nbp.copilot.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Liveness health endpoint for the Hardware Service Decision Copilot.
 *
 * <p>Used by Docker Compose healthcheck and frontend startup guards to confirm
 * the backend is accepting requests. Returns a simple JSON status object.</p>
 *
 * <p>Contract: {@code GET /api/health} → {@code 200 {"status":"UP"}} (ADR-001 §5).</p>
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * Returns a JSON liveness response.
     *
     * @return {@code 200 OK} with body {@code {"status":"UP"}}
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
