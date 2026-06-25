package pl.nbp.copilot.session;

import pl.nbp.copilot.web.model.Category;
import pl.nbp.copilot.web.model.RequestType;

import java.time.LocalDate;

/** Podsumowanie danych formularza przechowywane w sesji. */
public record CaseSummaryData(
        RequestType requestType,
        Category category,
        String model,
        LocalDate purchaseDate
) {}
