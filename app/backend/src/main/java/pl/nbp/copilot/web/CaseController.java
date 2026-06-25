package pl.nbp.copilot.web;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.nbp.copilot.ai.DecisionService;
import pl.nbp.copilot.image.ImageService;
import pl.nbp.copilot.web.model.CaseResponse;
import pl.nbp.copilot.web.model.CaseSummary;
import pl.nbp.copilot.web.model.CaseSubmission;

/**
 * Kontroler REST obsługujący zgłoszenia sprzętu elektronicznego.
 *
 * <p>Odbiera multipart/form-data z danymi zgłoszenia i zdjęciem,
 * waliduje wejście, kompresuje obraz i deleguje do {@link DecisionService}.
 * Mapowanie błędów na kody HTTP obsługuje {@link GlobalExceptionHandler}.</p>
 *
 * <p>Kontrakt: {@code POST /api/cases} → {@code 200 CaseResponse} (ADR-001 §5).</p>
 */
@RestController
@RequestMapping("/api")
public class CaseController {

    private static final Logger log = LoggerFactory.getLogger(CaseController.class);

    private final ImageService imageService;
    private final DecisionService decisionService;

    public CaseController(ImageService imageService, DecisionService decisionService) {
        this.imageService = imageService;
        this.decisionService = decisionService;
    }

    /**
     * Przyjmuje zgłoszenie zwrotu lub reklamacji sprzętu elektronicznego.
     *
     * <p>Waliduje dane formularza bean-validation, następnie waliduje i kompresuje obraz,
     * wywołuje pipeline AI (analiza + decyzja) i zwraca wynik z identyfikatorem sesji.</p>
     *
     * @param submission zwalidowane dane zgłoszenia z formularza
     * @return 200 z {@link CaseResponse} zawierającym decyzję i podsumowanie
     */
    @PostMapping(value = "/cases", consumes = "multipart/form-data")
    public ResponseEntity<CaseResponse> submitCase(@Valid @ModelAttribute CaseSubmission submission) {
        log.info("Odebrano zgłoszenie: typ={}, kategoria={}, sesja={}",
                submission.getRequestType(), submission.getCategory(), submission.getSessionId());

        imageService.validateImage(submission.getImage());

        var decision = decisionService.process(submission);

        var caseSummary = new CaseSummary(
                submission.getRequestType(),
                submission.getCategory(),
                submission.getModel(),
                submission.getPurchaseDate());

        var response = new CaseResponse(submission.getSessionId(), decision, caseSummary);
        return ResponseEntity.ok(response);
    }
}
