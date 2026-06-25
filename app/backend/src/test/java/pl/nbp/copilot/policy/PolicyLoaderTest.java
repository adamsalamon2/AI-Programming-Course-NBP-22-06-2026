package pl.nbp.copilot.policy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ResourceLoader;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@DisplayName("PolicyLoader")
class PolicyLoaderTest {

    @Autowired
    PolicyLoader policyLoader;

    @Test
    @DisplayName("polityka zwrotów ładuje się jako niepusty tekst")
    void returnPolicyIsNonEmpty() {
        assertThat(policyLoader.getReturnPolicy()).isNotBlank();
    }

    @Test
    @DisplayName("polityka reklamacji ładuje się jako niepusty tekst")
    void complaintPolicyIsNonEmpty() {
        assertThat(policyLoader.getComplaintPolicy()).isNotBlank();
    }

    @Test
    @DisplayName("brakujący plik polityki powoduje błąd startowy")
    void missingPolicyFileThrowsOnInit() {
        var mockResolver = new org.springframework.core.io.DefaultResourceLoader();
        var loader = new PolicyLoader(mockResolver) {
            @Override
            public void init() {
                throw new IllegalStateException("Brak wymaganego pliku polityki: test");
            }
        };
        assertThatThrownBy(loader::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("polityki");
    }
}
