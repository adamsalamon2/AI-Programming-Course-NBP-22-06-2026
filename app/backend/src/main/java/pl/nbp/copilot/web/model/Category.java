package pl.nbp.copilot.web.model;

import com.fasterxml.jackson.annotation.JsonValue;

/** Kategoria sprzętu elektronicznego. */
public enum Category {
    SMARTFONY("Smartfony"),
    LAPTOPY("Laptopy"),
    TABLETY("Tablety"),
    TELEWIZORY("Telewizory"),
    SLUCHAWKI("Słuchawki"),
    SMARTWATCHE("Smartwatche"),
    KONSOLE("Konsole do gier"),
    AUDIO("Sprzęt audio"),
    APARATY("Aparaty fotograficzne"),
    AKCESORIA("Akcesoria"),
    INNE("Inne");

    private final String label;

    Category(String label) {
        this.label = label;
    }

    @JsonValue
    public String getKey() {
        return name();
    }

    public String getLabel() {
        return label;
    }
}
