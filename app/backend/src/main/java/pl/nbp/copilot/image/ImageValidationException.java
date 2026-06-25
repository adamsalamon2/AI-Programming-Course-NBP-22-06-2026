package pl.nbp.copilot.image;

/**
 * Wyjątek zgłaszany gdy przesłany plik nie spełnia wymagań walidacji obrazu.
 */
public class ImageValidationException extends RuntimeException {

    public ImageValidationException(String message) {
        super(message);
    }
}
