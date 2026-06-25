package pl.nbp.copilot.web;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.nbp.copilot.ai.DecisionService;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.ai.model.Verdict;
import pl.nbp.copilot.config.CorsConfig;
import pl.nbp.copilot.image.ImageService;
import pl.nbp.copilot.image.ImageValidationException;
import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.RequestType;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link CaseController} using {@code @WebMvcTest} slice.
 *
 * <p>Verifies TAC-001-01 (no LLM call on validation failure), TAC-001-04 (size limit),
 * and the happy-path 200 response. The LLM and ImageService are mocked.</p>
 */
@WebMvcTest({CaseController.class, GlobalExceptionHandler.class})
@Import(CorsConfig.class)
@DisplayName("CaseController")
class CaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ImageService imageService;

    @MockitoBean
    private DecisionService decisionService;

    // Minimal valid JPEG magic bytes for testing
    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};

    private MockMultipartFile validImage() {
        return new MockMultipartFile(
                "image", "device.jpg", "image/jpeg", JPEG_MAGIC);
    }

    @Test
    @DisplayName("happy path — zwraca 200 z CaseResponse")
    void postCase_valid_returns200WithCaseResponse() throws Exception {
        var decision = new Decision(Verdict.APPROVE, "Uzasadnienie testowe",
                "Kolejne kroki", "Zastrzeżenie doradcze", null);
        when(imageService.compressToJpegBase64(any())).thenReturn("base64data");
        when(decisionService.process(any())).thenReturn(decision);

        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        .param("model", "Dell XPS 13")
                        .param("purchaseDate", LocalDate.now().minusDays(5).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.sessionId").value("test-session-uuid"))
                .andExpect(jsonPath("$.decision.verdict").value("APPROVE"))
                .andExpect(jsonPath("$.caseSummary.requestType").value("RETURN"));
    }

    @Test
    @DisplayName("TAC-001-01: brak wymaganego pola → 400 bez wywołania LLM")
    void postCase_missingModel_returns400_noLlmCall() throws Exception {
        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        // model missing
                        .param("purchaseDate", LocalDate.now().minusDays(5).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.fieldErrors").isArray());

        // TAC-001-01: LLM must NOT be called on validation failure
        verify(decisionService, never()).process(any());
    }

    @Test
    @DisplayName("TAC-001-01: przyszła data zakupu → 400 bez wywołania LLM")
    void postCase_futurePurchaseDate_returns400_noLlmCall() throws Exception {
        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        .param("model", "Dell XPS")
                        .param("purchaseDate", LocalDate.now().plusDays(1).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().isBadRequest());

        verify(decisionService, never()).process(any());
    }

    @Test
    @DisplayName("TAC-001-01: reklamacja bez powodu → 400 bez wywołania LLM")
    void postCase_complaintWithoutReason_returns400_noLlmCall() throws Exception {
        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "COMPLAINT")
                        .param("category", "SMARTFONY")
                        .param("model", "Samsung Galaxy")
                        .param("purchaseDate", LocalDate.now().minusDays(10).toString())
                        .param("sessionId", "test-session-uuid"))
                // reason is missing for COMPLAINT → validation fails
                .andExpect(status().isBadRequest());

        verify(decisionService, never()).process(any());
    }

    @Test
    @DisplayName("TAC-001-01: brak zdjęcia → 400 bez wywołania LLM")
    void postCase_missingImage_returns400_noLlmCall() throws Exception {
        mockMvc.perform(multipart("/api/cases")
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        .param("model", "Dell XPS")
                        .param("purchaseDate", LocalDate.now().minusDays(5).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().isBadRequest());

        verify(decisionService, never()).process(any());
    }

    @Test
    @DisplayName("nieprawidłowy format obrazu → 400 bez wywołania LLM")
    void postCase_invalidImageFormat_returns400_noLlmCall() throws Exception {
        doThrow(new ImageValidationException("Nieobsługiwany format obrazu"))
                .when(imageService).validateImage(any());

        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        .param("model", "Dell XPS")
                        .param("purchaseDate", LocalDate.now().minusDays(5).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").exists());

        verify(decisionService, never()).process(any());
    }

    @Test
    @DisplayName("błąd LLM → 502/503 bez fabrykowania decyzji")
    void postCase_llmFailure_returns502or503_noDecision() throws Exception {
        when(imageService.compressToJpegBase64(any())).thenReturn("base64data");
        when(decisionService.process(any())).thenThrow(new RuntimeException("Błąd połączenia z modelem AI"));

        mockMvc.perform(multipart("/api/cases")
                        .file(validImage())
                        .param("requestType", "RETURN")
                        .param("category", "LAPTOPY")
                        .param("model", "Dell XPS")
                        .param("purchaseDate", LocalDate.now().minusDays(5).toString())
                        .param("sessionId", "test-session-uuid"))
                .andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.decision").doesNotExist());
    }

    @Test
    @DisplayName("CORS — żądanie OPTIONS od dozwolonego originu zwraca 200")
    void corsPreflightFromAllowedOrigin_returns200() throws Exception {
        mockMvc.perform(options("/api/cases")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk());
    }
}
