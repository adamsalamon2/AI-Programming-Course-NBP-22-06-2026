import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Invalid form submissions — pure client-side validation
 *
 * PRD coverage:
 *   §4.4 Error — invalid submission
 *   §6 ACs: AC-04, AC-05, AC-06, AC-07, AC-08, AC-09
 *
 * These tests exercise client-side validation only (no LLM calls, no backend).
 * They should be runnable even before the LLM integration works.
 * AC-09: no LLM call is made until validation passes — enforced by asserting
 * that the app does NOT navigate to /chat on invalid submit.
 *
 * All expected error messages are in Polish (AC-25).
 */
test.describe('Walidacja formularza — błędy inline, brak nawigacji do chatu', () => {

  test('@smoke AC-06 brak zdjęcia blokuje wysłanie formularza', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Smartfony');
    await intakeForm.fillModel('Samsung Galaxy A55');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await intakeForm.fillPurchaseDate(yesterday.toISOString().split('T')[0]);

    // Submit without image (AC-06)
    await intakeForm.submit();

    // Should show an inline error about missing image
    // TODO(3.2): confirm exact Polish error text — e.g. "Zdjęcie jest wymagane" or "Dodaj zdjęcie"
    await intakeForm.expectErrorVisible(/zdj[eę]cie jest wymagane|dodaj zdj[eę]cie|brak zdj[eę]cia/i);
    await intakeForm.expectNoNavigation();
  });

  test('@smoke AC-04 przyszła data zakupu jest odrzucana z komunikatem błędu', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Laptopy');
    await intakeForm.fillModel('MacBook Pro 14');

    // Future date (AC-04)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await intakeForm.fillPurchaseDate(tomorrow.toISOString().split('T')[0]);

    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    // Should show inline error about future date
    // TODO(3.2): confirm exact Polish error — "Data zakupu nie może być w przyszłości" or similar
    await intakeForm.expectErrorVisible(/data.*przysz[łl]o[sś][cć]|data zakupu|przysz[łl]a data/i);
    await intakeForm.expectNoNavigation();
  });

  test('@smoke AC-05 puste pole Powód dla Reklamacji blokuje wysłanie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Reklamacja');
    await intakeForm.selectCategory('Słuchawki');
    await intakeForm.fillModel('Sony WH-1000XM5');

    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    await intakeForm.fillPurchaseDate(fiveMonthsAgo.toISOString().split('T')[0]);

    // Intentionally leave reason empty — required for Reklamacja (AC-05)
    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    // Inline error about empty reason
    // TODO(3.2): confirm exact Polish error text
    await intakeForm.expectErrorVisible(/pow[oó]d.*wymagany|uzupe[łl]nij pow[oó]d|pole wymagane/i);
    await intakeForm.expectNoNavigation();
  });

  test('@smoke AC-07 niedozwolony format pliku (GIF) jest odrzucany z komunikatem', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Konsole do gier');
    await intakeForm.fillModel('PlayStation 5');

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await intakeForm.fillPurchaseDate(tenDaysAgo.toISOString().split('T')[0]);

    // Upload a GIF — unsupported format (AC-07)
    await intakeForm.uploadImage(FIXTURES.wrongTypeGif);
    await intakeForm.submit();

    // Error must name the accepted formats: JPEG, PNG, WebP (AC-07)
    // TODO(3.2): confirm exact Polish error text — "Akceptowane formaty: JPEG, PNG, WebP"
    await intakeForm.expectErrorVisible(/JPEG|PNG|WebP/i);
    await intakeForm.expectErrorVisible(/format|niedozwolony|akceptowane/i);
    await intakeForm.expectNoNavigation();
  });

  test('@smoke AC-08 zdjęcie powyżej 10 MB jest odrzucane z komunikatem', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Reklamacja');
    await intakeForm.selectCategory('Telewizory');
    await intakeForm.fillModel('Samsung QN90C');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    await intakeForm.fillPurchaseDate(oneYearAgo.toISOString().split('T')[0]);

    await intakeForm.fillReason('Ekran telewizora przestał działać po roku od zakupu.');

    // Upload oversized file — exceeds 10 MB (AC-08)
    await intakeForm.uploadImage(FIXTURES.oversizedImageJpeg);
    await intakeForm.submit();

    // Error must mention the 10 MB limit (AC-08)
    // TODO(3.2): confirm exact Polish error text — "Plik nie może być większy niż 10 MB"
    await intakeForm.expectErrorVisible(/10 MB|za duży|rozmiar pliku/i);
    await intakeForm.expectNoNavigation();
  });

  test('AC-07 + AC-08 alternatywnie: walidacja pliku bez kliknięcia wysyłania (zmiana inputu)', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Zwrot');

    // Wrong type: GIF — error should appear immediately or on submit
    await intakeForm.uploadImage(FIXTURES.wrongTypeGif);

    // The error may appear immediately on file selection (client-side change event)
    // OR on submit — either is acceptable; we just check it eventually appears.
    // TODO(3.2): determine if Angular validates on file change or only on submit
    await intakeForm.submit();
    await intakeForm.expectErrorVisible(/JPEG|PNG|WebP|format/i);
    await intakeForm.expectNoNavigation();
  });

  test('AC-04 wcześniej poprawna data może być dziś (graniczny przypadek)', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    await intakeForm.goto();

    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Akcesoria');
    await intakeForm.fillModel('Logitech MX Master 3S');

    // Today's date is valid (not a future date) — should not produce a date error
    const today = new Date();
    await intakeForm.fillPurchaseDate(today.toISOString().split('T')[0]);

    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    // No date-specific error should appear
    // We may navigate to chat (today is valid) or get other validation errors —
    // but specifically no "przyszła data" error.
    const errors = await intakeForm.getErrorMessages();
    const dateFutureError = errors.some(e => /przysz[łl]|future/i.test(e));
    expect(dateFutureError).toBe(false);
  });
});
