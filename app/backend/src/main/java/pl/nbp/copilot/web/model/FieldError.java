package pl.nbp.copilot.web.model;

/** Błąd walidacji pojedynczego pola. */
public record FieldError(String field, String message) {}
