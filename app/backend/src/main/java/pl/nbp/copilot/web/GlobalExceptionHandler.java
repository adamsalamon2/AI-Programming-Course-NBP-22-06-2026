package pl.nbp.copilot.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import pl.nbp.copilot.image.ImageValidationException;
import pl.nbp.copilot.session.SessionNotFoundException;
import pl.nbp.copilot.web.model.ApiError;
import pl.nbp.copilot.web.model.FieldError;

import java.util.List;

/**
 * Globalny handler wyjątków dla warstwy REST.
 *
 * <p>Mapuje wyjątki aplikacyjne na ustrukturyzowane odpowiedzi {@link ApiError}
 * z polskimi komunikatami (ADR-001 §5):</p>
 * <ul>
 *   <li>{@link MethodArgumentNotValidException} → {@code 400} z listą błędów pól</li>
 *   <li>{@link ImageValidationException} → {@code 400} z komunikatem walidacji obrazu</li>
 *   <li>{@link MaxUploadSizeExceededException} → {@code 413} / {@code 400}</li>
 *   <li>{@link SessionNotFoundException} → {@code 404}</li>
 *   <li>Inne wyjątki → {@code 502} / {@code 503} (błąd LLM, nie fabrykujemy decyzji)</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Obsługuje błędy walidacji bean-validation ({@code @Valid}).
     * Żadne wywołanie LLM nie zostało wykonane w tym momencie.
     *
     * @param ex wyjątek walidacji
     * @return {@code 400} z listą błędów pól
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
                .toList();

        // Also handle global (class-level) constraint violations
        List<FieldError> globalErrors = ex.getBindingResult().getGlobalErrors().stream()
                .map(e -> new FieldError(e.getObjectName(), e.getDefaultMessage()))
                .toList();

        var allErrors = new java.util.ArrayList<>(fieldErrors);
        allErrors.addAll(globalErrors);

        log.debug("Błędy walidacji: {}", allErrors);
        var error = new ApiError("VALIDATION_ERROR", "Dane zgłoszenia są nieprawidłowe", allErrors);
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Obsługuje błędy walidacji obrazu (typ, magic bytes, rozmiar).
     *
     * @param ex wyjątek walidacji obrazu
     * @return {@code 400} z komunikatem błędu
     */
    @ExceptionHandler(ImageValidationException.class)
    public ResponseEntity<ApiError> handleImageValidation(ImageValidationException ex) {
        log.debug("Błąd walidacji obrazu: {}", ex.getMessage());
        var error = new ApiError("IMAGE_VALIDATION_ERROR", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Obsługuje przekroczenie limitu rozmiaru multipart.
     * Plik zbyt duży jest odrzucany przed jakąkolwiek analizą.
     *
     * @param ex wyjątek przekroczenia rozmiaru
     * @return {@code 413} z komunikatem błędu
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.debug("Przekroczono limit rozmiaru pliku: {}", ex.getMessage());
        var error = new ApiError("FILE_TOO_LARGE",
                "Plik przekracza dopuszczalny rozmiar 10 MB");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    /**
     * Obsługuje brak sesji (wygasła lub nieznana).
     *
     * @param ex wyjątek brakującej sesji
     * @return {@code 404} z komunikatem błędu
     */
    @ExceptionHandler(SessionNotFoundException.class)
    public ResponseEntity<ApiError> handleSessionNotFound(SessionNotFoundException ex) {
        log.debug("Sesja nie znaleziona: {}", ex.getMessage());
        var error = new ApiError("SESSION_NOT_FOUND",
                "Sesja nie istnieje lub wygasła. Proszę rozpocząć nowe zgłoszenie.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Fallback handler dla błędów LLM i innych nieoczekiwanych wyjątków.
     *
     * <p>Nie fabrykuje decyzji — zwraca retryable {@code 502/503}.</p>
     *
     * @param ex nieobsługiwany wyjątek
     * @return {@code 502} z polskim komunikatem o błędzie
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex) {
        log.error("Nieobsługiwany błąd serwera", ex);
        var error = new ApiError("AI_SERVICE_ERROR",
                "Wystąpił błąd podczas przetwarzania zgłoszenia. Proszę spróbować ponownie za chwilę.");
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }
}
