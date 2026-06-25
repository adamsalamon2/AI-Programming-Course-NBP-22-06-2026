package pl.nbp.copilot.web.model;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

/**
 * Dane zgłoszenia przesyłane jako multipart/form-data.
 *
 * <p>Klasa (nie record) ze setterami, wymagana do bindowania Spring MVC z {@code @ModelAttribute}.</p>
 */
public class CaseSubmission {

    @NotNull(message = "Typ zgłoszenia jest wymagany")
    private RequestType requestType;

    @NotNull(message = "Kategoria urządzenia jest wymagana")
    private Category category;

    @NotBlank(message = "Nazwa/model urządzenia jest wymagana")
    private String model;

    @NotNull(message = "Data zakupu jest wymagana")
    @PastOrPresent(message = "Data zakupu nie może być w przyszłości")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate purchaseDate;

    private String reason;

    @NotBlank(message = "Identyfikator sesji jest wymagany")
    private String sessionId;

    @NotNull(message = "Zdjęcie urządzenia jest wymagane")
    private MultipartFile image;

    /** Powód jest wymagany dla reklamacji. */
    @AssertTrue(message = "Powód jest wymagany dla reklamacji")
    public boolean isReasonValid() {
        if (requestType == RequestType.COMPLAINT) {
            return reason != null && !reason.isBlank();
        }
        return true;
    }

    public RequestType getRequestType() { return requestType; }
    public void setRequestType(RequestType requestType) { this.requestType = requestType; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public MultipartFile getImage() { return image; }
    public void setImage(MultipartFile image) { this.image = image; }
}
