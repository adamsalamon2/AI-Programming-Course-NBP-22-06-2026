package pl.nbp.copilot.ai.model;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/**
 * Ustrukturyzowana decyzja agenta AI.
 *
 * <p>Pola opatrzone {@code @JsonPropertyDescription} opisują schemat dla modelu LLM
 * przy generowaniu ustrukturyzowanych danych wyjściowych.</p>
 */
public class Decision {

    @JsonPropertyDescription("Werdykt: APPROVE (zaakceptuj), REJECT (odrzuć) lub NEEDS_REVIEW (wymaga weryfikacji)")
    private Verdict verdict;

    @JsonPropertyDescription("Uzasadnienie decyzji w języku polskim, odwołujące się do konkretnych czynników: czasu od zakupu, analizy zdjęcia, mającej zastosowanie reguły polityki")
    private String justification;

    @JsonPropertyDescription("Kolejne kroki dla klienta w języku polskim")
    private String nextSteps;

    @JsonPropertyDescription("Obowiązkowe zastrzeżenie w języku polskim: decyzja ma charakter doradczy i nie jest wiążącą decyzją firmy")
    private String disclaimer;

    @JsonPropertyDescription("Brakujące lub niejasne informacje (tylko dla NEEDS_REVIEW), w języku polskim; null dla APPROVE i REJECT")
    private String missingInfo;

    public Decision() {}

    public Decision(Verdict verdict, String justification, String nextSteps, String disclaimer, String missingInfo) {
        this.verdict = verdict;
        this.justification = justification;
        this.nextSteps = nextSteps;
        this.disclaimer = disclaimer;
        this.missingInfo = missingInfo;
    }

    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public String getNextSteps() { return nextSteps; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public String getMissingInfo() { return missingInfo; }
    public void setMissingInfo(String missingInfo) { this.missingInfo = missingInfo; }
}
