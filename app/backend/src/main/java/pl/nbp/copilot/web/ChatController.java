package pl.nbp.copilot.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.ai.ChatService;
import pl.nbp.copilot.web.model.ChatRequest;

/**
 * Kontroler REST obsługujący strumieniowy czat wieloturowy.
 *
 * <p>Odbiera żądania JSON {@link ChatRequest}, deleguje przetwarzanie do {@link ChatService}
 * działającego na wątku wirtualnym i zwraca {@link SseEmitter} produkujący zdarzenia
 * {@code text/event-stream}. Sesja musi istnieć (seeded przez {@code /api/cases}) —
 * brak sesji powoduje odpowiedź 404 (obsługiwaną przez {@link GlobalExceptionHandler}).</p>
 *
 * <p>Kontrakt: {@code POST /api/chat/stream} → {@code text/event-stream} (ADR-001 §5,
 * TAC-001-05/06).</p>
 */
@RestController
@RequestMapping("/api")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Wysyła wiadomość użytkownika i zwraca strumieniowaną odpowiedź asystenta.
     *
     * <p>Wyszukuje sesję po {@code sessionId}; jeśli sesja nie istnieje lub wygasła,
     * {@link pl.nbp.copilot.session.SessionNotFoundException} jest propagowany do
     * {@link GlobalExceptionHandler}, który zwraca {@code 404}. Praca strumieniowania
     * odbywa się w wątku wirtualnym (delegacja do {@link ChatService}).</p>
     *
     * @param request żądanie zawierające {@code sessionId} i treść wiadomości
     * @return {@link SseEmitter} ze zdarzeniami tokenów i terminalnym zdarzeniem {@code complete}
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestBody ChatRequest request) {
        log.debug("Odebrano żądanie czatu, sesja={}", request.sessionId());
        return chatService.chat(request.sessionId(), request.message());
    }
}
