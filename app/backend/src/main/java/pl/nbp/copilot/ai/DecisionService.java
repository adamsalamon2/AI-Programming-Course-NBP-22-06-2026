package pl.nbp.copilot.ai;

import com.openai.models.chat.completions.ChatCompletionMessageParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pl.nbp.copilot.ai.model.Decision;
import pl.nbp.copilot.image.ImageService;
import pl.nbp.copilot.session.CaseSummaryData;
import pl.nbp.copilot.session.Conversation;
import pl.nbp.copilot.session.ConversationStore;
import pl.nbp.copilot.web.model.CaseSubmission;
import pl.nbp.copilot.web.model.RequestType;

import java.time.Instant;
import java.util.List;

/**
 * Orkiestruje przepływ analizy zgłoszenia:
 * walidacja obrazu → kompresja → analiza wizji → decyzja → zapis sesji.
 */
@Service
public class DecisionService {

    private static final Logger log = LoggerFactory.getLogger(DecisionService.class);

    private final ImageService imageService;
    private final VisionAnalyzer visionAnalyzer;
    private final DecisionEngine decisionEngine;
    private final ConversationStore conversationStore;
    private final PromptFactory promptFactory;

    public DecisionService(ImageService imageService,
                           VisionAnalyzer visionAnalyzer,
                           DecisionEngine decisionEngine,
                           ConversationStore conversationStore,
                           PromptFactory promptFactory) {
        this.imageService = imageService;
        this.visionAnalyzer = visionAnalyzer;
        this.decisionEngine = decisionEngine;
        this.conversationStore = conversationStore;
        this.promptFactory = promptFactory;
    }

    /**
     * Przetwarza zgłoszenie i zwraca decyzję doradczą.
     *
     * @param submission zwalidowane dane zgłoszenia
     * @return ustrukturyzowana decyzja
     */
    public Decision process(CaseSubmission submission) {
        log.info("Przetwarzam zgłoszenie sesji={} typ={}", submission.getSessionId(), submission.getRequestType());

        imageService.validateImage(submission.getImage());
        String imageBase64 = imageService.compressToJpegBase64(submission.getImage());

        String imageAnalysis = visionAnalyzer.analyze(imageBase64, submission.getRequestType());
        log.debug("Analiza obrazu zakończona dla sesji={}", submission.getSessionId());

        String formData = buildFormSummary(submission);
        String systemPrompt = promptFactory.buildDecisionSystemPrompt(
                submission.getRequestType(), formData, imageAnalysis);

        List<ChatCompletionMessageParam> messages = List.of(
                ChatCompletionMessageParam.ofSystem(
                        com.openai.models.chat.completions.ChatCompletionSystemMessageParam.builder()
                                .content(systemPrompt)
                                .build()),
                ChatCompletionMessageParam.ofUser(
                        com.openai.models.chat.completions.ChatCompletionUserMessageParam.builder()
                                .content("Wydaj decyzję na podstawie dostarczonych danych.")
                                .build())
        );

        Decision decision = decisionEngine.decide(messages);
        log.info("Decyzja dla sesji={}: {}", submission.getSessionId(), decision.getVerdict());

        seedConversation(submission, imageAnalysis, decision);
        return decision;
    }

    private void seedConversation(CaseSubmission submission, String imageAnalysis, Decision decision) {
        var summary = new CaseSummaryData(
                submission.getRequestType(),
                submission.getCategory(),
                submission.getModel(),
                submission.getPurchaseDate());

        var conversation = new Conversation(
                submission.getSessionId(),
                summary,
                imageAnalysis,
                List.of(),
                Instant.now());

        conversationStore.save(conversation);
    }

    private String buildFormSummary(CaseSubmission submission) {
        var sb = new StringBuilder();
        sb.append("Typ zgłoszenia: ").append(submission.getRequestType().getLabel()).append("\n");
        sb.append("Kategoria: ").append(submission.getCategory().getLabel()).append("\n");
        sb.append("Model urządzenia: ").append(submission.getModel()).append("\n");
        sb.append("Data zakupu: ").append(submission.getPurchaseDate()).append("\n");
        if (submission.getReason() != null && !submission.getReason().isBlank()) {
            sb.append("Powód zgłoszenia: ").append(submission.getReason()).append("\n");
        }
        return sb.toString();
    }
}
