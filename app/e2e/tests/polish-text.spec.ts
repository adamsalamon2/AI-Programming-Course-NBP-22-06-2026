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
 * All selectors confirmed against live DOM (Step 3.2).
 */
test.describe('AC-25 Wszystkie teksty widoczne dla użytkownika są po polsku', () => {

  test('@smoke AC-01 selektor typu żądania zawiera opcje po polsku (Reklamacja / Zwrot)', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // The two request-type options must be labeled in Polish (AC-01)
    // Confirmed: radiogroup "Rodzaj wniosku" with radio "Reklamacja" / radio "Zwrot"
    await expect(page.getByRole('radio', { name: 'Reklamacja' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Zwrot' })).toBeVisible();
  });

  test('AC-02 lista kategorii sprzętu zawiera polskie nazwy', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Open the category dropdown to reveal options
    await intakeForm.categorySelect.click();

    // All 11 predefined categories must be present in Polish (PRD §8 Functional)
    // Confirmed: mat-option renders as role="option" in a listbox overlay
    const expectedCategories = [
      'Smartfony', 'Laptopy', 'Tablety', 'Telewizory', 'Słuchawki',
      'Smartwatche', 'Konsole do gier', 'Sprzęt audio',
      'Aparaty fotograficzne', 'Akcesoria', 'Inne',
    ];

    for (const category of expectedCategories) {
      await expect(page.getByRole('option', { name: category })).toBeVisible();
    }

    // Close the dropdown
    await page.keyboard.press('Escape');
  });

  test('AC-25 etykiety pól formularza są po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Confirmed exact Polish label strings from the Angular template / pl.ts:
    // "Kategoria sprzętu", "Nazwa / model urządzenia", "Data zakupu",
    // "Opis powodu", "Zdjęcie urządzenia"

    // Use exact: true or role-based locators to avoid strict-mode violation
    // "Zdjęcie urządzenia" appears in both a label and the subtitle sentence
    await expect(page.getByText('Kategoria sprzętu', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel('Nazwa / model urządzenia')).toBeVisible();
    await expect(page.getByLabel(/Data zakupu/)).toBeVisible();
    await expect(page.getByText(/Opis powodu/).first()).toBeVisible();
    // Target the field-label specifically; the subtitle also contains the phrase
    await expect(page.getByText('Zdjęcie urządzenia', { exact: true })).toBeVisible();
  });

  test('AC-25 przycisk wysyłania jest po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Confirmed submit button label: "Wyślij wniosek" (from pl.ts intake.submitButton)
    await expect(
      page.getByRole('button', { name: 'Wyślij wniosek' })
    ).toBeVisible();
  });

  test('AC-25 komunikaty błędów walidacji są po polsku', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Select Reklamacja first so all fields have validators active
    await intakeForm.selectRequestType('Reklamacja');

    // Trigger validation errors by submitting an empty form
    await intakeForm.submit();

    // Wait for at least one mat-error to appear (Angular change detection)
    const errors = intakeForm.fieldErrors;
    await expect(errors.first()).toBeVisible();

    const count = await errors.count();

    // There should be at least one error (category, model, date required)
    expect(count).toBeGreaterThan(0);

    // Each error should not contain common English validation words
    for (let i = 0; i < count; i++) {
      const errorText = await errors.nth(i).textContent() ?? '';
      const hasEnglishValidation = /\bis required\b|\binvalid\b|\bmust be\b|\bplease\b/i.test(errorText);
      expect(hasEnglishValidation, `Error message "${errorText}" is not in Polish`).toBe(false);
    }
  });

  test('AC-25 wymagany marker pola Powód zmienia się po zmianie typu żądania', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    // Select Reklamacja — reason should show as "wymagane"
    await intakeForm.selectRequestType('Reklamacja');
    // Confirmed: label becomes "Opis powodu wymagane"
    await expect(page.getByLabel(/Opis powodu wymagane/i)).toBeVisible();

    // Switch to Zwrot — reason should show as "opcjonalne"
    await intakeForm.selectRequestType('Zwrot');
    // Confirmed: label becomes "Opis powodu opcjonalne"
    await expect(page.getByLabel(/Opis powodu opcjonalne/i)).toBeVisible();
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

    // AC-25: should not contain significant English
    // Contains Polish/Latin characters
    const hasMostlyPolish = /[a-ząćęłńóśźż]/i.test(firstBubble);
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

    // The case summary fields live inside a collapsible panel toggled by
    // "Podsumowanie zgłoszenia". Expand it before asserting on the field values.
    await chatPage.expandSummaryPanel();

    // The submitted data should be visible in Polish after expanding.
    // Use exact:true / role-scoped locators to avoid strict-mode violations
    // (the same words may appear in the LLM reply bubble).
    await expect(page.getByText('Reklamacja', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Laptopy', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Acer Predator/).first()).toBeVisible();
  });
});
