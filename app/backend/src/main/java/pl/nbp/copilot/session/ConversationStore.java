package pl.nbp.copilot.session;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Magazyn konwersacji w pamięci operacyjnej.
 *
 * <p>Klucz: identyfikator sesji generowany przez klienta.
 * Wpisy są usuwane po przekroczeniu TTL bezczynności (domyślnie 30 minut).
 * Pojemność ograniczona do {@code maxEntries} wpisów.</p>
 */
@Component
public class ConversationStore {

    private static final Logger log = LoggerFactory.getLogger(ConversationStore.class);

    private final ConcurrentHashMap<String, Conversation> store = new ConcurrentHashMap<>();
    private volatile Clock clock;
    private final Duration idleTtl;
    private final int maxEntries;

    public ConversationStore() {
        this(Clock.systemUTC(), Duration.ofMinutes(30), 1000);
    }

    ConversationStore(Clock clock, Duration idleTtl, int maxEntries) {
        this.clock = clock;
        this.idleTtl = idleTtl;
        this.maxEntries = maxEntries;
    }

    /**
     * Zapisuje konwersację. Jeśli osiągnięto limit, najstarsze wpisy zostaną usunięte.
     *
     * @param conversation konwersacja do zapisania
     */
    public void save(Conversation conversation) {
        if (store.size() >= maxEntries) {
            log.warn("Magazyn konwersacji pełny ({} wpisów), próba usunięcia wygasłych", maxEntries);
            evictExpired();
        }
        store.put(conversation.getSessionId(), conversation);
    }

    /**
     * Pobiera konwersację po identyfikatorze sesji.
     *
     * @param sessionId identyfikator sesji
     * @return konwersacja lub pusty Optional gdy nie istnieje/wygasła
     */
    public Optional<Conversation> findById(String sessionId) {
        return Optional.ofNullable(store.get(sessionId));
    }

    /**
     * Usuwa wygasłe konwersacje (idle TTL przekroczony).
     * Wywoływana automatycznie co minutę przez scheduler.
     */
    @Scheduled(fixedDelay = 60_000)
    public void evictExpired() {
        Instant now = clock.instant();
        int before = store.size();
        store.entrySet().removeIf(entry ->
                Duration.between(entry.getValue().getLastActivityAt(), now).compareTo(idleTtl) > 0);
        int removed = before - store.size();
        if (removed > 0) {
            log.info("Usunięto {} wygasłych konwersacji, pozostało: {}", removed, store.size());
        }
    }

    /** Pozwala ustawić zegar (dla testów). */
    void setClock(Clock clock) {
        this.clock = clock;
    }
}
