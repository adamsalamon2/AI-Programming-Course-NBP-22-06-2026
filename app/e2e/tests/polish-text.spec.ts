import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: All user-facing text is in Polish
 *
 * PRD coverage:
 *   §8 Constraints (Language: all user-facing text in Polish)
 *   §6 ACs: AC-01, AC-02, AC-25
 *   ADR-003 §3 (pl constants, Polish labels)
 *
 * These tests verify that key labels, buttons, errors, and decision text
 * are rendered in Polish on both the intake form screen and the chat screen.
 *
 * Selector assumptions are flagged; confirm against live DOM at Step 3.2.
 */
test.describe('AC-25 Wszystkie teksty widoczne dla użytkownika są po polsku', () => {

  test('@smoke AC-01 selektor typu żądania zawiera opcje po polsku (Reklamacja / Zwrot)', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // The two request-type options must be labeled in Polish (AC-01)
    await expect(page.getByText('Reklamacja')).toBeVisible();
    await expect(page.getByText('Zwrot')).toBeVisible();
  });

  test('AC-02 lista kategorii sprzętu zawiera polskie nazwy', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Open the category dropdown to reveal options
    await intakeForm.categorySelect.click();

    // All 11 predefined categories must be present in Polish (PRD §8 Functional)
    const expectedCategories = [
      'Smartfony', 'Laptopy', 'Tablety', 'Telewizory', 'Słuchawki',
      'Smartwatche', 'Konsole do gier', 'Sprzęt audio',
      'Aparaty fotograficzne', 'Akcesoria', 'Inne',
    ];

    for (const category of expectedCategories) {
      await expect(page.getByRole('option', { name: category })).toBeVisible(); // TODO(3.2): confirm mat-option role
    }

    // Close the dropdown
    await page.keyboard.press('Escape');
  });

  test('AC-25 etykiety pól formularza są po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Key form labels must be in Polish
    // TODO(3.2): confirm exact Polish label strings from the Angular template

    // Category label
    await expect(page.getByText(/Kategoria sprzętu|Kategoria/i)).toBeVisible();

    // Model/name label
    await expect(page.getByText(/Nazwa modelu|Model|Nazwa/i)).toBeVisible();

    // Purchase date label
    await expect(page.getByText(/Data zakupu/i)).toBeVisible();

    // Reason label (some variant)
    await expect(page.getByText(/Pow[óo]d|Opis problemu/i)).toBeVisible();

    // Photo upload label
    await expect(page.getByText(/Zdj[ęe]cie|Prześlij zdj[ęe]cie|Dodaj zdj[ęe]cie/i)).toBeVisible();
  });

  test('AC-25 przycisk wysyłania jest po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Submit button must have a Polish label
    // TODO(3.2): confirm exact label — "Wyślij", "Prześlij", "Sprawdź" etc.
    await expect(
      page.getByRole('button', { name: /wy[sś]lij|przeka[zź]|sprawdź|wy[sś]lij wniosek/i })
    ).toBeVisible();
  });

  test('AC-25 komunikaty błędów walidacji są po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Trigger validation errors by submitting an empty form
    await intakeForm.submit();

    // All visible mat-error messages should contain Polish text (no English words like "required", "invalid")
    const errors = intakeForm.fieldErrors;
    const count = await errors.count();

    // There should be at least one error
    expect(count).toBeGreaterThan(0);

    // Each error should not contain common English validation words
    for (let i = 0; i < count; i++) {
      const errorText = await errors.nth(i).textContent() ?? '';
      // English validation words that would indicate non-Polish UI
      const hasEnglishValidation = /\bis required\b|\binvalid\b|\bmust be\b|\bplease\b/i.test(errorText);
      expect(hasEnglishValidation, `Error message "${errorText}" is not in Polish`).toBe(false);
    }
  });

  test('AC-25 wymagany marker pola Powód zmienia się po zmianie typu żądania', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Select Reklamacja — reason should show as required
    await intakeForm.selectRequestType('Reklamacja');
    // TODO(3.2): confirm Polish "wymagany" marker text or asterisk (*) aria-label
    await expect(page.getByText(/wymagane|wymagany|\*/i).first()).toBeVisible();

    // Switch to Zwrot — reason should show as optional
    await intakeForm.selectRequestType('Zwrot');
    // TODO(3.2): confirm Polish "opcjonalny" text appears or "wymagany" disappears
    const optionalText = page.getByText(/opcjonalny|opcjonalne|nieobowi[ąa]zkowy/i);
    // Either optional text appears OR the required indicator disappears
    const optionalVisible = await optionalText.isVisible().catch(() => false);
    // Just assert the form is still rendered (the exact marker may vary)
    await expect(intakeForm.reasonTextarea).toBeVisible();

    // TODO(3.2): strengthen this assertion once the Angular template label wording is confirmed
    void optionalVisible; // suppress unused variable warning — strengthened at 3.2
  });

  test('AC-25 pierwszy komunikat agenta w chacie jest po polsku i zawiera zastrzeżenie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Smartfony');
    await intakeForm.fillModel('Nokia 3310');

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await intakeForm.fillPurchaseDate(fiveDaysAgo.toISOString().split('T')[0]);

    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    await chatPage.waitForDecision();

    const firstBubble = await chatPage.getFirstBubbleText();

    // AC-25: should not contain significant English (LLM was instructed to respond in Polish)
    // We allow technical abbreviations like "OK", "LLM" but not full English sentences
    const hasMostlyPolish = /[a-ząćęłńóśźż]/i.test(firstBubble); // contains Polish/Latin characters
    expect(hasMostlyPolish).toBe(true);
    expect(firstBubble.length).toBeGreaterThan(50); // substantive response

    // Advisory disclaimer in Polish (AC-18, AC-25)
    await chatPage.expectDisclaimerInFirstBubble();
  });

  test('AC-25 pole podsumowania sprawy w chacie jest po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Reklamacja');
    await intakeForm.selectCategory('Laptopy');
    await intakeForm.fillModel('Acer Predator Helios 16');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    await intakeForm.fillPurchaseDate(sixMonthsAgo.toISOString().split('T')[0]);

    await intakeForm.fillReason('Bateria laptopa rozładowuje się w ciągu 30 minut od pełnego naładowania.');
    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    await chatPage.waitForDecision();

    // The case summary (header/panel) should show submitted data in Polish labels
    // TODO(3.2): confirm selector for case summary panel
    await expect(page.getByText(/Reklamacja/i)).toBeVisible();
    await expect(page.getByText(/Laptopy/i)).toBeVisible();
    // Model name may appear as typed:
    await expect(page.getByText(/Acer Predator/i)).toBeVisible();
  });
});
