package pl.nbp.copilot.session;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.RequestType;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ConversationStore")
class ConversationStoreTest {

    private static final Duration SHORT_TTL = Duration.ofSeconds(1);

    private Conversation sampleConversation(String sessionId) {
        var summary = new CaseSummaryData(
                RequestType.RETURN,
                Category.LAPTOPY,
                "Dell XPS 13",
                LocalDate.of(2026, 6, 1));
        return new Conversation(sessionId, summary, "Analiza obrazu", List.of(), Instant.now());
    }

    @Test
    @DisplayName("przechowuje i pobiera konwersację po id")
    void storeAndRetrieve() {
        var store = new ConversationStore(Clock.systemUTC(), Duration.ofMinutes(30), 1000);
        var conversation = sampleConversation("session-1");

        store.save(conversation);

        assertThat(store.findById("session-1")).isPresent().get().isEqualTo(conversation);
    }

    @Test
    @DisplayName("nieznany id zwraca pustą Optional")
    void unknownIdReturnsEmpty() {
        var store = new ConversationStore(Clock.systemUTC(), Duration.ofMinutes(30), 1000);

        assertThat(store.findById("nonexistent")).isEmpty();
    }

    @Test
    @DisplayName("konwersacja jest usuwana po przekroczeniu TTL")
    void evictedAfterTtl() throws Exception {
        // Use a fixed clock starting in the past
        Instant past = Instant.now().minus(Duration.ofMinutes(31));
        var pastClock = Clock.fixed(past, ZoneId.systemDefault());
        var store = new ConversationStore(pastClock, Duration.ofMinutes(30), 1000);

        // Save conversation with past timestamp
        var summary = new CaseSummaryData(RequestType.RETURN, Category.LAPTOPY, "test", LocalDate.now());
        var conversation = new Conversation("old-session", summary, "analysis", List.of(), past);
        store.save(conversation);

        // Advance clock to now and evict
        var nowClock = Clock.fixed(Instant.now(), ZoneId.systemDefault());
        store.setClock(nowClock);
        store.evictExpired();

        assertThat(store.findById("old-session")).isEmpty();
    }

    @Test
    @DisplayName("konwersacja z niedawną aktywnością nie jest usuwana")
    void recentConversationNotEvicted() {
        var store = new ConversationStore(Clock.systemUTC(), Duration.ofMinutes(30), 1000);
        var conversation = sampleConversation("active-session");

        store.save(conversation);
        store.evictExpired();

        assertThat(store.findById("active-session")).isPresent();
    }
}
