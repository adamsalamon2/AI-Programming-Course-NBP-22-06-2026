package pl.nbp.copilot.web.model;

import java.util.List;

/** Odpowiedź błędu API. */
public record ApiError(String code, String message, List<FieldError> fieldErrors) {

    public ApiError(String code, String message) {
        this(code, message, List.of());
    }
}
