import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Intake Form screen (route: /).
 *
 * All selectors confirmed against the live Angular Material DOM on 2026-06-25 (Step 3.2).
 *
 * Key findings:
 * - mat-button-toggle-group renders as radiogroup "Rodzaj wniosku" with radio buttons
 * - mat-select renders as combobox "Kategoria sprzętu"; options appear in a listbox overlay
 * - reason textarea label is dynamic: "Opis powodu wymagane" (COMPLAINT) / "Opis powodu opcjonalne" (RETURN)
 * - file input has aria-label="Prześlij zdjęcie urządzenia" and is hidden; triggered by button "Wybierz zdjęcie"
 * - submit button label: "Wyślij wniosek"
 * - error messages render as mat-error elements
 * - image errors render as mat-error.standalone-error (outside mat-form-field)
 */
export class IntakeFormPage {
  readonly page: Page;

  // Request type toggle (mat-button-toggle-group renders as radiogroup)
  readonly requestTypeGroup: Locator;
  readonly reklamacjaButton: Locator;
  readonly zwrotButton: Locator;

  // Category dropdown (mat-select renders as combobox)
  readonly categorySelect: Locator;

  // Model text input
  readonly modelInput: Locator;

  // Purchase date picker
  readonly purchaseDateInput: Locator;

  // Reason textarea — label is "Opis powodu wymagane" or "Opis powodu opcjonalne"
  readonly reasonTextarea: Locator;

  // File upload input (hidden, has aria-label)
  readonly fileInput: Locator;

  // Image preview thumbnail
  readonly imagePreview: Locator;

  // Submit button
  readonly submitButton: Locator;

  // Validation error messages (mat-error elements, including standalone)
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Request type — mat-button-toggle-group renders as radiogroup in the DOM
    this.requestTypeGroup = page.getByRole('radiogroup', { name: 'Rodzaj wniosku' });
    this.reklamacjaButton = page.getByRole('radio', { name: 'Reklamacja' });
    this.zwrotButton = page.getByRole('radio', { name: 'Zwrot' });

    // Category — combobox (mat-select)
    this.categorySelect = page.getByRole('combobox', { name: 'Kategoria sprzętu' });

    // Model text input — confirmed label
    this.modelInput = page.getByLabel('Nazwa / model urządzenia');

    // Purchase date — confirmed label
    this.purchaseDateInput = page.getByLabel('Data zakupu');

    // Reason textarea — label varies; use regex to match both variants
    this.reasonTextarea = page.getByLabel(/Opis powodu/);

    // File input — hidden input with aria-label; use setInputFiles() directly
    this.fileInput = page.locator('input[type="file"][aria-label="Prześlij zdjęcie urządzenia"]');

    // Image preview after upload
    this.imagePreview = page.locator('img[alt="Podgląd zdjęcia"]');

    // Submit button — confirmed label
    this.submitButton = page.getByRole('button', { name: 'Wyślij wniosek' });

    // All mat-error messages on the form (inside and outside mat-form-field)
    this.fieldErrors = page.locator('mat-error');
  }

  async goto() {
    await this.page.goto('/');
    // Wait for the form to be ready — submit button is always present
    await expect(this.submitButton).toBeVisible();
  }

  async selectRequestType(type: 'Reklamacja' | 'Zwrot') {
    if (type === 'Reklamacja') {
      await this.reklamacjaButton.click();
    } else {
      await this.zwrotButton.click();
    }
  }

  async selectCategory(category: string) {
    await this.categorySelect.click();
    // mat-option appears in a listbox overlay panel
    await this.page.getByRole('option', { name: category }).click();
  }

  async fillModel(model: string) {
    await this.modelInput.fill(model);
  }

  async fillPurchaseDate(dateIsoString: string) {
    // Angular Material datepicker — fill the input directly with YYYY-MM-DD
    // The datepicker may parse it; press Tab to commit the value
    await this.purchaseDateInput.click();
    await this.purchaseDateInput.fill(dateIsoString);
    await this.page.keyboard.press('Tab');
    // Close the picker if it opened
    await this.page.keyboard.press('Escape');
  }

  async fillReason(reason: string) {
    await this.reasonTextarea.fill(reason);
  }

  async uploadImage(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getErrorMessages(): Promise<string[]> {
    const errors = await this.fieldErrors.allTextContents();
    return errors.map(e => e.trim()).filter(Boolean);
  }

  async expectErrorVisible(partialText: string | RegExp) {
    await expect(
      this.page.locator('mat-error, [role="alert"]').filter({ hasText: partialText })
    ).toBeVisible();
  }

  async expectNoNavigation() {
    // Still on the form page — URL should not contain /chat
    await expect(this.page).not.toHaveURL(/\/chat/);
  }
}
