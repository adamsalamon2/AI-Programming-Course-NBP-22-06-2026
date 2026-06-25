import { pl } from './pl';

describe('pl i18n constants', () => {
  // ── Form labels ───────────────────────────────────────────────────────────
  it('exposes intake form label keys', () => {
    expect(pl.intake.title).toBeTruthy();
    expect(pl.intake.description).toBeTruthy();
    expect(pl.intake.requestTypeLabel).toBeTruthy();
    expect(pl.intake.categoryLabel).toBeTruthy();
    expect(pl.intake.modelLabel).toBeTruthy();
    expect(pl.intake.modelPlaceholder).toBeTruthy();
    expect(pl.intake.purchaseDateLabel).toBeTruthy();
    expect(pl.intake.reasonLabel).toBeTruthy();
    expect(pl.intake.reasonPlaceholderRequired).toBeTruthy();
    expect(pl.intake.reasonPlaceholderOptional).toBeTruthy();
    expect(pl.intake.reasonRequired).toBeTruthy();
    expect(pl.intake.reasonOptional).toBeTruthy();
    expect(pl.intake.imageLabel).toBeTruthy();
    expect(pl.intake.imageHint).toBeTruthy();
    expect(pl.intake.submitButton).toBeTruthy();
    expect(pl.intake.submittingButton).toBeTruthy();
  });

  // ── Request type options ──────────────────────────────────────────────────
  it('exposes request type labels', () => {
    expect(pl.intake.requestTypes.COMPLAINT).toBeTruthy();
    expect(pl.intake.requestTypes.RETURN).toBeTruthy();
  });

  // ── 11 category labels ───────────────────────────────────────────────────
  it('exposes all 11 category labels', () => {
    expect(pl.categories.SMARTFONY).toBe('Smartfony');
    expect(pl.categories.LAPTOPY).toBe('Laptopy');
    expect(pl.categories.TABLETY).toBe('Tablety');
    expect(pl.categories.TELEWIZORY).toBe('Telewizory');
    expect(pl.categories.SLUCHAWKI).toBe('Słuchawki');
    expect(pl.categories.SMARTWATCHE).toBe('Smartwatche');
    expect(pl.categories.KONSOLE).toBe('Konsole do gier');
    expect(pl.categories.AUDIO).toBe('Sprzęt audio');
    expect(pl.categories.APARATY).toBe('Aparaty fotograficzne');
    expect(pl.categories.AKCESORIA).toBe('Akcesoria');
    expect(pl.categories.INNE).toBe('Inne');
    // Exactly 11 categories
    expect(Object.keys(pl.categories).length).toBe(11);
  });

  // ── Validation errors ─────────────────────────────────────────────────────
  it('exposes validation error keys including image format and size', () => {
    expect(pl.errors.required).toBeTruthy();
    expect(pl.errors.futureDateNotAllowed).toBeTruthy();
    expect(pl.errors.imageRequired).toBeTruthy();
    expect(pl.errors.imageFormatInvalid).toBeTruthy();
    // Must name JPEG, PNG, WebP
    expect(pl.errors.imageFormatInvalid).toContain('JPEG');
    expect(pl.errors.imageFormatInvalid).toContain('PNG');
    expect(pl.errors.imageFormatInvalid).toContain('WebP');
    // Must mention 10 MB
    expect(pl.errors.imageTooLarge).toContain('10 MB');
    expect(pl.errors.categoryRequired).toBeTruthy();
    expect(pl.errors.modelRequired).toBeTruthy();
    expect(pl.errors.purchaseDateRequired).toBeTruthy();
    expect(pl.errors.reasonRequired).toBeTruthy();
    expect(pl.errors.generic).toBeTruthy();
    expect(pl.errors.retryable).toBeTruthy();
  });

  // ── Chat labels ───────────────────────────────────────────────────────────
  it('exposes chat UI keys', () => {
    expect(pl.chat.inputPlaceholder).toBeTruthy();
    expect(pl.chat.sendButton).toBeTruthy();
    expect(pl.chat.typingIndicator).toBeTruthy();
    expect(pl.chat.retryButton).toBeTruthy();
    expect(pl.chat.startNewCase).toBeTruthy();
    expect(pl.chat.disclaimerHeader).toBeTruthy();
    expect(pl.chat.summaryTitle).toBeTruthy();
  });

  // ── Verdict labels ────────────────────────────────────────────────────────
  it('exposes verdict labels in Polish', () => {
    expect(pl.verdict.APPROVE).toBeTruthy();
    expect(pl.verdict.REJECT).toBeTruthy();
    expect(pl.verdict.NEEDS_REVIEW).toBeTruthy();
  });

  // ── Image upload UI ───────────────────────────────────────────────────────
  it('exposes image upload UI strings', () => {
    expect(pl.intake.imageSelectButton).toBeTruthy();
    expect(pl.intake.imageRemoveButton).toBeTruthy();
    expect(pl.intake.imageReplaceButton).toBeTruthy();
  });
});
