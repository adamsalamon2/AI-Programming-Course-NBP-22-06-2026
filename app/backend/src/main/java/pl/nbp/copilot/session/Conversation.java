package pl.nbp.copilot.session;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Stan konwersacji przechowywany w pamięci operacyjnej.
 *
 * <p>Tworzony po pomyślnej decyzji, usuwany po przekroczeniu TTL bezczynności.</p>
 */
public class Conversation {

    private final String sessionId;
    private final CaseSummaryData caseSummary;
    private final String imageAnalysis;
    private final List<ChatMessage> messages;
    private final Instant createdAt;
    private volatile Instant lastActivityAt;

    public Conversation(String sessionId, CaseSummaryData caseSummary, String imageAnalysis,
                        List<ChatMessage> messages, Instant createdAt) {
        this.sessionId = sessionId;
        this.caseSummary = caseSummary;
        this.imageAnalysis = imageAnalysis;
        this.messages = new ArrayList<>(messages);
        this.createdAt = createdAt;
        this.lastActivityAt = createdAt;
    }

    public String getSessionId() { return sessionId; }
    public CaseSummaryData getCaseSummary() { return caseSummary; }
    public String getImageAnalysis() { return imageAnalysis; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastActivityAt() { return lastActivityAt; }

    /** Zwraca kopię listy wiadomości. */
    public synchronized List<ChatMessage> getMessages() {
        return List.copyOf(messages);
    }

    /** Dodaje wiadomość do konwersacji i aktualizuje czas ostatniej aktywności. */
    public synchronized void addMessage(ChatMessage message) {
        messages.add(message);
        this.lastActivityAt = Instant.now();
    }

    /** Aktualizuje czas ostatniej aktywności. */
    public void touch(Instant now) {
        this.lastActivityAt = now;
    }
}
