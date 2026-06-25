package pl.nbp.copilot.web.model;

import com.fasterxml.jackson.annotation.JsonValue;

/** Typ zgłoszenia: reklamacja lub zwrot. */
public enum RequestType {
    COMPLAINT("Reklamacja"),
    RETURN("Zwrot");

    private final String label;

    RequestType(String label) {
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
