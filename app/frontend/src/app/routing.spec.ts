import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown } from 'ngx-markdown';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { pl } from './i18n/pl';

describe('App routing', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideMarkdown(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('/ route is configured', () => {
    const intakeRoute = routes.find((r) => r.path === '');
    expect(intakeRoute).toBeTruthy();
  });

  it('/chat route is configured', () => {
    const chatRoute = routes.find((r) => r.path === 'chat');
    expect(chatRoute).toBeTruthy();
  });

  it('navigates to / (intake form)', async () => {
    await router.navigate(['/']);
    expect(router.url).toBe('/');
  });

  it('navigates to /chat', async () => {
    await router.navigate(['/chat']);
    expect(router.url).toBe('/chat');
  });
});

describe('Polish text audit', () => {
  it('all intake form labels are non-empty Polish strings', () => {
    expect(pl.intake.title.length).toBeGreaterThan(5);
    expect(pl.intake.submitButton.length).toBeGreaterThan(2);
    expect(pl.intake.submittingButton.length).toBeGreaterThan(2);
    expect(pl.intake.reasonLabel.length).toBeGreaterThan(2);
    expect(pl.intake.imageLabel.length).toBeGreaterThan(2);
  });

  it('all error messages are non-empty Polish strings', () => {
    expect(pl.errors.generic.length).toBeGreaterThan(5);
    expect(pl.errors.retryable.length).toBeGreaterThan(5);
    expect(pl.errors.imageFormatInvalid.length).toBeGreaterThan(5);
    expect(pl.errors.imageTooLarge.length).toBeGreaterThan(5);
    expect(pl.errors.reasonRequired.length).toBeGreaterThan(2);
  });

  it('all chat labels are non-empty Polish strings', () => {
    expect(pl.chat.inputPlaceholder.length).toBeGreaterThan(2);
    expect(pl.chat.sendButton.length).toBeGreaterThan(1);
    expect(pl.chat.retryButton.length).toBeGreaterThan(2);
    expect(pl.chat.startNewCase.length).toBeGreaterThan(5);
    expect(pl.chat.disclaimerHeader.length).toBeGreaterThan(3);
  });

  it('verdict labels are Polish (not raw enum keys)', () => {
    // Should be Polish labels, not raw enum keys
    expect(pl.verdict.APPROVE).not.toBe('APPROVE');
    expect(pl.verdict.REJECT).not.toBe('REJECT');
    expect(pl.verdict.NEEDS_REVIEW).not.toBe('NEEDS_REVIEW');
  });

  it('category labels are Polish descriptive strings', () => {
    // Check some known values are in Polish
    expect(pl.categories.SLUCHAWKI).toContain('ł'); // Słuchawki has ł
    expect(pl.categories.KONSOLE).toContain('do'); // Konsole do gier
    expect(pl.categories.APARATY).toContain('graficzne'); // Aparaty fotograficzne
  });

  it('no English hardcoded strings in pl constants (spot check)', () => {
    // Submit should not say 'Submit' in English
    expect(pl.intake.submitButton).not.toBe('Submit');
    expect(pl.intake.submitButton).not.toBe('Send');
    // Category label should not be just 'Category'
    expect(pl.intake.categoryLabel).not.toBe('Category');
  });
});
