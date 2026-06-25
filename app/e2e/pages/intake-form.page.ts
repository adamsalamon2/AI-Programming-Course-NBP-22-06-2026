import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Intake Form screen (route: /).
 *
 * All Polish labels are frozen from PRD §9.1 and ADR-003 §3.
 * Selectors marked // TODO(3.2): confirm selector must be verified
 * against the live Angular Material component tree before Step 3.2 runs.
 */
export class IntakeFormPage {
  readonly page: Page;

  // Request type toggle (mat-button-toggle-group)
  // TODO(3.2): confirm selector — Angular Material may render as [role="group"] or individual buttons
  readonly requestTypeGroup: Locator;
  readonly reklamacjaButton: Locator;
  readonly zwrotButton: Locator;

  // Category dropdown (mat-select)
  // TODO(3.2): confirm selector — mat-select may use combobox role
  readonly categorySelect: Locator;

  // Model text input (matInput)
  // TODO(3.2): confirm label text — Polish label expected
  readonly modelInput: Locator;

  // Purchase date picker (mat-datepicker)
  // TODO(3.2): confirm label text — Polish label expected
  readonly purchaseDateInput: Locator;

  // Reason textarea
  // TODO(3.2): confirm label text — changes between "Powód (wymagany)" / "Powód (opcjonalny)"
  readonly reasonTextarea: Locator;

  // File upload input (hidden <input type=file>)
  // TODO(3.2): confirm — may need to target by accept attribute or data-testid
  readonly fileInput: Locator;

  // Image preview thumbnail
  // TODO(3.2): confirm — may be an <img> inside a preview container
  readonly imagePreview: Locator;

  // Submit button
  // TODO(3.2): confirm Polish label — "Wyślij" / "Prześlij" / "Sprawdź"
  readonly submitButton: Locator;

  // Validation error messages (mat-error elements)
  // TODO(3.2): confirm — mat-error elements appear below each field
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Request type — button-toggle-group or radio group
    this.requestTypeGroup = page.getByRole('group').filter({ hasText: /Reklamacja|Zwrot/i });
    this.reklamacjaButton = page.getByRole('radio', { name: 'Reklamacja' })
      .or(page.getByRole('button', { name: 'Reklamacja' })); // TODO(3.2): confirm selector
    this.zwrotButton = page.getByRole('radio', { name: 'Zwrot' })
      .or(page.getByRole('button', { name: 'Zwrot' })); // TODO(3.2): confirm selector

    // Category — combobox (mat-select renders as role="combobox")
    this.categorySelect = page.getByRole('combobox', { name: /kategoria/i }); // TODO(3.2): confirm label

    // Model text input
    this.modelInput = page.getByLabel(/model|nazwa/i); // TODO(3.2): confirm exact Polish label

    // Purchase date
    this.purchaseDateInput = page.getByLabel(/data zakupu/i); // TODO(3.2): confirm label

    // Reason textarea
    this.reasonTextarea = page.getByLabel(/pow[oó]d/i); // TODO(3.2): confirm label; matches "Powód"

    // File input — target hidden input accept attribute
    this.fileInput = page.locator('input[type="file"][accept*="image"]'); // TODO(3.2): confirm selector

    // Image preview
    this.imagePreview = page.locator('img[alt*="podgl"]').or(page.locator('.image-preview img')); // TODO(3.2): confirm selector

    // Submit button
    this.submitButton = page.getByRole('button', { name: /wy[sś]lij|przeka[zź]|sprawdź|wy[sś]lij/i }); // TODO(3.2): confirm Polish label

    // All mat-error messages on the form
    this.fieldErrors = page.locator('mat-error');
  }

  async goto() {
    await this.page.goto('/');
    // Wait for the form to be visible
    await expect(this.page.locator('form').first()).toBeVisible(); // TODO(3.2): confirm form selector
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
    // mat-option appears in an overlay panel
    await this.page.getByRole('option', { name: category }).click(); // TODO(3.2): confirm overlay role
  }

  async fillModel(model: string) {
    await this.modelInput.fill(model);
  }

  async fillPurchaseDate(dateIsoString: string) {
    // Angular Material datepicker — fill the input directly
    await this.purchaseDateInput.fill(dateIsoString);
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

  async expectErrorVisible(partialText: string) {
    await expect(
      this.page.locator('mat-error, [role="alert"]').filter({ hasText: partialText })
    ).toBeVisible(); // TODO(3.2): confirm error element selector
  }

  async expectNoNavigation() {
    // Still on the form page — URL should not contain /chat
    await expect(this.page).not.toHaveURL(/\/chat/);
  }
}
