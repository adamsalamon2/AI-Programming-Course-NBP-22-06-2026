package pl.nbp.copilot.web.model;

import java.time.LocalDate;

/** Podsumowanie zgłoszenia (do zwrócenia klientowi). */
public record CaseSummary(RequestType requestType, Category category, String model, LocalDate purchaseDate) {}
