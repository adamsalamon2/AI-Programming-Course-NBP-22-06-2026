package pl.nbp.copilot.session;

/** Pojedyncza wiadomość w konwersacji. */
public record ChatMessage(MessageRole role, String content) {}
