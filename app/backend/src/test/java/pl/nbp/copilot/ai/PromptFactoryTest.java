package pl.nbp.copilot.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import pl.nbp.copilot.policy.PolicyLoader;
import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.RequestType;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("PromptFactory")
class PromptFactoryTest {

    private PolicyLoader policyLoader;
    private PromptFactory promptFactory;

    @BeforeEach
    void setup() {
        policyLoader = mock(PolicyLoader.class);
        when(policyLoader.getReturnPolicy()).thenReturn("POLITYKA ZWROTÓW TESTOWA");
        when(policyLoader.getComplaintPolicy()).thenReturn("POLITYKA REKLAMACJI TESTOWA");
        promptFactory = new PromptFactory(policyLoader);
    }

    @Test
    @DisplayName("dla RETURN zwraca prompt analizy zwrotu")
    void returnTypeGivesReturnAnalysisPrompt() {
        String prompt = promptFactory.buildAnalysisSystemPrompt(RequestType.RETURN);
        assertThat(prompt).containsIgnoringCase("zwrot")
                .containsIgnoringCase("odsprzedaż");
    }

    @Test
    @DisplayName("dla COMPLAINT zwraca prompt analizy reklamacji")
    void complaintTypeGivesComplaintAnalysisPrompt() {
        String prompt = promptFactory.buildAnalysisSystemPrompt(RequestType.COMPLAINT);
        assertThat(prompt).containsIgnoringCase("reklamac")
                .containsIgnoringCase("uszkodzen");
    }

    @Test
    @DisplayName("prompt decyzji zwrotu zawiera politykę zwrotów")
    void returnDecisionPromptContainsReturnPolicy() {
        String form = "Model: Laptop Dell, Data: 2026-01-01";
        String analysis = "Brak śladów użytkowania";
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, form, analysis);
        assertThat(prompt).contains("POLITYKA ZWROTÓW TESTOWA");
    }

    @Test
    @DisplayName("prompt decyzji reklamacji zawiera politykę reklamacji")
    void complaintDecisionPromptContainsComplaintPolicy() {
        String form = "Model: Telefon Samsung, Data: 2025-06-01";
        String analysis = "Widoczne pęknięcie ekranu";
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.COMPLAINT, form, analysis);
        assertThat(prompt).contains("POLITYKA REKLAMACJI TESTOWA");
    }

    @Test
    @DisplayName("prompt decyzji zwrotu NIE zawiera polityki reklamacji")
    void returnDecisionPromptDoesNotContainComplaintPolicy() {
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, "form", "analysis");
        assertThat(prompt).doesNotContain("POLITYKA REKLAMACJI TESTOWA");
    }

    @Test
    @DisplayName("prompt zawiera klauzulę doradczą (guardrail)")
    void promptContainsAdvisoryGuardrail() {
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, "form", "analysis");
        assertThat(prompt.toLowerCase())
                .contains("doradc");
    }

    @Test
    @DisplayName("prompt zawiera klauzulę o zastrzeżeniu (disclaimer)")
    void promptContainsDisclaimer() {
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, "form", "analysis");
        assertThat(prompt.toLowerCase())
                .contains("zastrzeżenie");
    }

    @Test
    @DisplayName("prompt zawiera instrukcję przekierowania off-topic")
    void promptContainsOffTopicRedirect() {
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, "form", "analysis");
        assertThat(prompt.toLowerCase())
                .containsAnyOf("temat", "niezwiązane", "inny temat", "off-topic", "nie dotyczy");
    }

    @Test
    @DisplayName("prompt decyzji zawiera dane formularza")
    void decisionPromptContainsFormData() {
        String form = "Model: Sony Xperia, Data: 2026-03-15";
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, form, "OK");
        assertThat(prompt).contains(form);
    }

    @Test
    @DisplayName("prompt decyzji zawiera analizę obrazu")
    void decisionPromptContainsImageAnalysis() {
        String analysis = "Urządzenie nie wykazuje śladów użytkowania";
        String prompt = promptFactory.buildDecisionSystemPrompt(RequestType.RETURN, "form", analysis);
        assertThat(prompt).contains(analysis);
    }
}
