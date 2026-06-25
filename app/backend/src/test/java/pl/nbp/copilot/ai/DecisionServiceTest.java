package pl.nbp.copilot.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.ai.model.Verdict;
import pl.nbp.copilot.image.ImageService;
import pl.nbp.copilot.image.ImageValidationException;
import pl.nbp.copilot.session.Conversation;
import pl.nbp.copilot.session.ConversationStore;
import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.CaseSubmission;
import pl.nbp.copilot.web.model.RequestType;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DecisionService")
class DecisionServiceTest {

    @Mock
    private ImageService imageService;
    @Mock
    private VisionAnalyzer visionAnalyzer;
    @Mock
    private DecisionEngine decisionEngine;
    @Mock
    private ConversationStore conversationStore;
    @Mock
    private PromptFactory promptFactory;

    private DecisionService decisionService;

    private static final byte[] JPEG_MAGIC = new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF, 0x00};

    @BeforeEach
    void setUp() {
        decisionService = new DecisionService(imageService, visionAnalyzer, decisionEngine, conversationStore, promptFactory);
        lenient().when(promptFactory.buildDecisionSystemPrompt(any(), any(), any())).thenReturn("system-prompt");
    }

    private CaseSubmission buildSubmission(RequestType type) {
        var file = new MockMultipartFile("image", "test.jpg", "image/jpeg", JPEG_MAGIC);
        var sub = new CaseSubmission();
        sub.setRequestType(type);
        sub.setCategory(Category.LAPTOPY);
        sub.setModel("Dell XPS 13");
        sub.setPurchaseDate(LocalDate.of(2025, 1, 15));
        sub.setSessionId("sess-001");
        sub.setImage(file);
        if (type == RequestType.COMPLAINT) {
            sub.setReason("Urządzenie się nie włącza");
        }
        return sub;
    }

    @Test
    @DisplayName("zwraca decyzję i zapisuje konwersację dla zwrotu")
    void processReturn_savesConversationAndReturnsDecision() {
        var submission = buildSubmission(RequestType.RETURN);
        var expectedDecision = new Decision(Verdict.APPROVE, "OK", "Zwróć produkt", "Decyzja doradcza", null);

        when(imageService.compressToJpegBase64(any())).thenReturn("base64data");
        when(visionAnalyzer.analyze(eq("base64data"), eq(RequestType.RETURN))).thenReturn("Analiza: dobry stan");
        when(decisionEngine.decide(anyList())).thenReturn(expectedDecision);

        Decision result = decisionService.process(submission);

        assertThat(result).isEqualTo(expectedDecision);
        verify(imageService).validateImage(any());
        verify(imageService).compressToJpegBase64(any());
        verify(visionAnalyzer).analyze("base64data", RequestType.RETURN);
        verify(decisionEngine).decide(anyList());
        verify(conversationStore).save(any(Conversation.class));
    }

    @Test
    @DisplayName("zwraca decyzję dla reklamacji z powodem")
    void processComplaint_withReason_returnsDecision() {
        var submission = buildSubmission(RequestType.COMPLAINT);
        var expectedDecision = new Decision(Verdict.REJECT, "Uszkodzenie mechaniczne", "Brak uprawnień", "Decyzja doradcza", null);

        when(imageService.compressToJpegBase64(any())).thenReturn("base64complaint");
        when(visionAnalyzer.analyze(eq("base64complaint"), eq(RequestType.COMPLAINT))).thenReturn("Widoczne uszkodzenia");
        when(decisionEngine.decide(anyList())).thenReturn(expectedDecision);

        Decision result = decisionService.process(submission);

        assertThat(result.getVerdict()).isEqualTo(Verdict.REJECT);
        verify(conversationStore).save(any(Conversation.class));
    }

    @Test
    @DisplayName("rzuca ImageValidationException gdy obraz jest nieprawidłowy")
    void process_invalidImage_throwsValidationException() {
        var submission = buildSubmission(RequestType.RETURN);
        doThrow(new ImageValidationException("Nieobsługiwany typ pliku"))
                .when(imageService).validateImage(any());

        assertThatThrownBy(() -> decisionService.process(submission))
                .isInstanceOf(ImageValidationException.class)
                .hasMessageContaining("Nieobsługiwany typ pliku");

        verify(visionAnalyzer, never()).analyze(any(), any());
        verify(decisionEngine, never()).decide(any());
        verify(conversationStore, never()).save(any());
    }

    @Test
    @DisplayName("rzuca RuntimeException gdy model LLM zawodzi")
    void process_llmFails_throwsRuntimeException() {
        var submission = buildSubmission(RequestType.RETURN);
        when(imageService.compressToJpegBase64(any())).thenReturn("base64data");
        when(visionAnalyzer.analyze(any(), any())).thenThrow(new RuntimeException("LLM timeout"));

        assertThatThrownBy(() -> decisionService.process(submission))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("LLM timeout");

        verify(conversationStore, never()).save(any());
    }

    @Test
    @DisplayName("zapisana konwersacja ma id sesji z formularza")
    void process_savedConversationHasCorrectSessionId() {
        var submission = buildSubmission(RequestType.RETURN);
        var decision = new Decision(Verdict.APPROVE, "OK", "Dalej", "Disclaimer", null);

        when(imageService.compressToJpegBase64(any())).thenReturn("b64");
        when(visionAnalyzer.analyze(any(), any())).thenReturn("analiza");
        when(decisionEngine.decide(anyList())).thenReturn(decision);

        decisionService.process(submission);

        verify(conversationStore).save(argThat(conv -> "sess-001".equals(conv.getSessionId())));
    }
}
