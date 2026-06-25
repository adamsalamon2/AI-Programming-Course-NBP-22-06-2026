package pl.nbp.copilot.web.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@DisplayName("CaseSubmission – walidacja")
class CaseSubmissionValidationTest {

    private static Validator validator;

    private static final byte[] JPEG_MAGIC = new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

    @BeforeAll
    static void setup() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    private CaseSubmission validReturn() {
        var s = new CaseSubmission();
        s.setRequestType(RequestType.RETURN);
        s.setCategory(Category.LAPTOPY);
        s.setModel("Dell XPS 13");
        s.setPurchaseDate(LocalDate.now().minusDays(5));
        s.setSessionId("test-session-id");
        s.setImage(new MockMultipartFile("image", "test.jpg", "image/jpeg", JPEG_MAGIC));
        return s;
    }

    private CaseSubmission validComplaint() {
        var s = validReturn();
        s.setRequestType(RequestType.COMPLAINT);
        s.setReason("Urządzenie nie ładuje się poprawnie");
        return s;
    }

    @Test
    @DisplayName("prawidłowe zgłoszenie zwrotu przechodzi walidację")
    void validReturnPasses() {
        var violations = validator.validate(validReturn());
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("prawidłowe zgłoszenie reklamacji przechodzi walidację")
    void validComplaintPasses() {
        var violations = validator.validate(validComplaint());
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("brak nazwy urządzenia powoduje błąd walidacji")
    void missingModelFails() {
        var s = validReturn();
        s.setModel(null);
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("model"));
    }

    @Test
    @DisplayName("pusta nazwa urządzenia powoduje błąd walidacji")
    void blankModelFails() {
        var s = validReturn();
        s.setModel("   ");
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("model"));
    }

    @Test
    @DisplayName("data zakupu w przyszłości powoduje błąd walidacji")
    void futurePurchaseDateFails() {
        var s = validReturn();
        s.setPurchaseDate(LocalDate.now().plusDays(1));
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("purchaseDate"));
    }

    @Test
    @DisplayName("reklamacja bez powodu powoduje błąd walidacji")
    void complaintWithoutReasonFails() {
        var s = validComplaint();
        s.setReason(null);
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("reasonValid"));
    }

    @Test
    @DisplayName("reklamacja z pustym powodem powoduje błąd walidacji")
    void complaintWithBlankReasonFails() {
        var s = validComplaint();
        s.setReason("   ");
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("zwrot bez powodu jest prawidłowy")
    void returnWithoutReasonPasses() {
        var s = validReturn();
        s.setReason(null);
        var violations = validator.validate(s);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("zwrot z powodem jest prawidłowy")
    void returnWithReasonPasses() {
        var s = validReturn();
        s.setReason("Zmieniłem zdanie");
        var violations = validator.validate(s);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("brak daty zakupu powoduje błąd walidacji")
    void nullPurchaseDateFails() {
        var s = validReturn();
        s.setPurchaseDate(null);
        var violations = validator.validate(s);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("purchaseDate"));
    }
}
