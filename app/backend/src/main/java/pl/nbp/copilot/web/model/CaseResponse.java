package pl.nbp.copilot.web.model;

import pl.nbp.copilot.ai.model.Decision;

/** Odpowiedź na zgłoszenie sprawy zawierająca decyzję i identyfikator sesji. */
public record CaseResponse(String sessionId, Decision decision, CaseSummary caseSummary) {}
