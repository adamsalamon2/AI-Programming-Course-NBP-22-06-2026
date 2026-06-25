package pl.nbp.copilot.web.model;

/** Żądanie kolejnej tury rozmowy. */
public record ChatRequest(String sessionId, String message) {}
