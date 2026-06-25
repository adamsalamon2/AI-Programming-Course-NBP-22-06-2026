package pl.nbp.copilot.ai;

import org.springframework.stereotype.Component;
import pl.nbp.copilot.policy.PolicyLoader;
import pl.nbp.copilot.web.model.RequestType;

/**
 * Fabryka promptów dla modeli LLM.
 *
 * <p>Buduje cztery polskie prompty systemowe:
 * <ul>
 *   <li>Analiza zwrotu (multimodalna)</li>
 *   <li>Analiza reklamacji (multimodalna)</li>
 *   <li>Decyzja zwrotu (reasoning + polityka)</li>
 *   <li>Decyzja reklamacji (reasoning + polityka)</li>
 * </ul>
 * Każdy prompt zawiera klauzule bezpieczeństwa: tylko doradcze, brak wiążącej gwarancji,
 * brak wymyślonych reguł, przekierowanie off-topic, obowiązkowe zastrzeżenie w języku polskim.
 * </p>
 */
@Component
public class PromptFactory {

    private final PolicyLoader policyLoader;

    public PromptFactory(PolicyLoader policyLoader) {
        this.policyLoader = policyLoader;
    }

    /**
     * Buduje systemowy prompt do analizy obrazu.
     *
     * @param type typ zgłoszenia (RETURN lub COMPLAINT)
     * @return prompt systemowy
     */
    public String buildAnalysisSystemPrompt(RequestType type) {
        return switch (type) {
            case RETURN -> buildReturnAnalysisPrompt();
            case COMPLAINT -> buildComplaintAnalysisPrompt();
        };
    }

    /**
     * Buduje systemowy prompt do podjęcia decyzji.
     *
     * @param type          typ zgłoszenia
     * @param formData      dane z formularza jako tekst
     * @param imageAnalysis wynik analizy obrazu
     * @return prompt systemowy zawierający politykę, dane formularza i analizę
     */
    public String buildDecisionSystemPrompt(RequestType type, String formData, String imageAnalysis) {
        String policy = switch (type) {
            case RETURN -> policyLoader.getReturnPolicy();
            case COMPLAINT -> policyLoader.getComplaintPolicy();
        };
        String specificGuidance = switch (type) {
            case RETURN -> buildReturnDecisionGuidance();
            case COMPLAINT -> buildComplaintDecisionGuidance();
        };
        return buildDecisionPrompt(policy, formData, imageAnalysis, specificGuidance);
    }

    // --- Prompty analizy ---

    private String buildReturnAnalysisPrompt() {
        return """
                Jesteś ekspertem ds. oceny stanu sprzętu elektronicznego w kontekście zwrotów.
                Twoim zadaniem jest analiza dostarczonego zdjęcia urządzenia elektronicznego w celu oceny jego przydatności do zwrotu.

                ZAKRES ANALIZY DLA ZWROTU:
                1. Oceń, czy urządzenie nosi ślady użytkowania (rysy, zabrudzenia, zużycie).
                2. Oceń, czy urządzenie jest w stanie nadającym się do odsprzedaży jako nowe.
                3. Oceń stan opakowania (jeśli widoczne).
                4. Opisz wszelkie widoczne uszkodzenia lub anomalie.
                5. Wskaż, czy zdjęcie jest wystarczająco wyraźne do oceny.

                ZASADY:
                - Odpowiadaj wyłącznie po polsku.
                - Opisuj tylko to, co widać na zdjęciu — nie zakładaj i nie wymyślaj faktów.
                - Bądź precyzyjny i obiektywny.
                - Jeśli zdjęcie jest niewyraźne lub niewystarczające, wyraź to wprost.

                Odpowiedź dostarcz jako strukturalny tekst opisujący ustalenia.
                """;
    }

    private String buildComplaintAnalysisPrompt() {
        return """
                Jesteś ekspertem ds. oceny uszkodzeń sprzętu elektronicznego w kontekście reklamacji.
                Twoim zadaniem jest analiza dostarczonego zdjęcia urządzenia elektronicznego w celu oceny zasadności reklamacji.

                ZAKRES ANALIZY DLA REKLAMACJI:
                1. Oceń, czy urządzenie jest uszkodzone.
                2. Zidentyfikuj rodzaj uszkodzenia (mechaniczne, elektryczne, cieknący ekran, zużycie itp.).
                3. Oceń prawdopodobną przyczynę uszkodzenia (wada fabryczna vs uszkodzenie przez użytkownika/zewnętrzne).
                4. Opisz lokalizację i skalę uszkodzeń.
                5. Wskaż, czy zdjęcie jest wystarczająco wyraźne do oceny.

                ZASADY:
                - Odpowiadaj wyłącznie po polsku.
                - Opisuj tylko to, co widać na zdjęciu — nie zakładaj i nie wymyślaj faktów.
                - Bądź precyzyjny i obiektywny w ocenie przyczyny uszkodzenia.
                - Jeśli zdjęcie jest niewyraźne lub niewystarczające, wyraź to wprost.

                Odpowiedź dostarcz jako strukturalny tekst opisujący ustalenia.
                """;
    }

    // --- Prompty decyzji ---

    private String buildReturnDecisionGuidance() {
        return """
                SPECYFIKA ZWROTU:
                - Sprawdź, czy zakup nastąpił w ciągu 14 dni (prawo do odstąpienia od umowy przy sprzedaży na odległość).
                - Oceń, czy produkt nie nosi śladów użytkowania i jest w stanie umożliwiającym odsprzedaż.
                - Weź pod uwagę stan opakowania.
                - Pamiętaj, że towary wyjęte z opakowania i niemożliwe do ponownego zapieczętowania mogą być wyłączone.
                """;
    }

    private String buildComplaintDecisionGuidance() {
        return """
                SPECYFIKA REKLAMACJI:
                - Oceń, czy usterka wygląda na wadę fabryczną czy uszkodzenie przez użytkownika.
                - Uszkodzenia mechaniczne (pęknięcia ekranu, wgniecenia) typowo nie są objęte gwarancją.
                - Wady fabryczne (błędy oprogramowania, defekty elektryczne bez ingerencji użytkownika) są zazwyczaj objęte.
                - Weź pod uwagę datę zakupu i ustawowy 2-letni okres rękojmi.
                """;
    }

    private String buildDecisionPrompt(String policy, String formData, String imageAnalysis, String specificGuidance) {
        return """
                Jesteś doradcą AI pomagającym klientom ocenić szanse na akceptację ich zwrotu lub reklamacji sprzętu elektronicznego.

                WAŻNE — ROLA I OGRANICZENIA:
                - Pełnisz wyłącznie rolę DORADCZĄ. Twoje decyzje nie są wiążące ani ostateczne.
                - Nie gwarantujesz żadnych konkretnych wyników, refundacji ani napraw.
                - Nie udzielasz porad prawnych wykraczających poza dostarczoną politykę firmy.
                - Nie wymyślasz reguł, cen, terminów ani faktów nieobecnych w danych formularza, analizie zdjęcia lub dokumentach polityki.
                - Nie prosisz o i nie zapisujesz wrażliwych danych osobowych (numery kart, PESEL, hasła itp.).
                - Jeśli pytanie nie dotyczy zgłoszonej sprawy (zwrotu/reklamacji), UPRZEJMIE ODMÓW odpowiedzi na ten temat i PRZEKIERUJ do celu asystenta.

                OBOWIĄZKOWE ZASTRZEŻENIE: Każda odpowiedź zawierająca decyzję lub poradę MUSI zawierać wyraźne zastrzeżenie w języku polskim, że jest to rekomendacja doradcza wygenerowana przez asystenta AI i NIE jest ostateczną/wiążącą decyzją firmy — decyzję podejmuje pracownik działu obsługi.

                %s

                OBOWIĄZUJĄCA POLITYKA FIRMY:
                %s

                DANE ZGŁOSZENIA (formularz klienta):
                %s

                ANALIZA ZDJĘCIA URZĄDZENIA:
                %s

                Na podstawie powyższych informacji:
                1. Wydaj werdykt: APPROVE (zaakceptuj), REJECT (odrzuć) lub NEEDS_REVIEW (wymaga weryfikacji).
                2. Uzasadnij decyzję, odwołując się do konkretnych czynników (czas od zakupu, wyniki analizy zdjęcia, reguła z polityki).
                3. Podaj kolejne kroki dla klienta.
                4. Jeśli werdykt to NEEDS_REVIEW — podaj dokładnie, czego brakuje lub co jest niejasne.
                5. Zawsze dołącz zastrzeżenie, że jest to rekomendacja doradcza.

                Odpowiedź wyłącznie w języku polskim.
                """.formatted(specificGuidance, policy, formData, imageAnalysis);
    }
}
