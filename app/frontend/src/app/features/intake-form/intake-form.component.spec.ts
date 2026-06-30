import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { IntakeFormComponent } from './intake-form.component';
import { CaseApiService } from '../../core/case-api.service';
import { pl } from '../../i18n/pl';

describe('IntakeFormComponent — structure + base validators', () => {
  let fixture: ComponentFixture<IntakeFormComponent>;
  let component: IntakeFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntakeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('form is invalid when empty (required fields missing)', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('requestType control is required', () => {
    const ctrl = component.form.get('requestType');
    expect(ctrl).toBeTruthy();
    ctrl!.setValue(null);
    expect(ctrl!.hasError('required')).toBeTrue();
    ctrl!.setValue('COMPLAINT');
    expect(ctrl!.valid).toBeTrue();
  });

  it('category control is required', () => {
    const ctrl = component.form.get('category');
    expect(ctrl).toBeTruthy();
    ctrl!.setValue(null);
    expect(ctrl!.hasError('required')).toBeTrue();
    ctrl!.setValue('LAPTOPY');
    expect(ctrl!.valid).toBeTrue();
  });

  it('model control is required', () => {
    const ctrl = component.form.get('model');
    expect(ctrl).toBeTruthy();
    ctrl!.setValue('');
    expect(ctrl!.hasError('required')).toBeTrue();
    ctrl!.setValue('iPhone 15');
    expect(ctrl!.valid).toBeTrue();
  });

  it('purchaseDate control is required', () => {
    const ctrl = component.form.get('purchaseDate');
    expect(ctrl).toBeTruthy();
    ctrl!.setValue(null);
    expect(ctrl!.hasError('required')).toBeTrue();
  });

  it('rejects a future purchase date', () => {
    const ctrl = component.form.get('purchaseDate');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    ctrl!.setValue(futureDate);
    expect(ctrl!.errors).toBeTruthy();
    expect(ctrl!.hasError('matDatepickerMax') || ctrl!.hasError('futureDate')).toBeTrue();
  });

  it('accepts today as purchase date', () => {
    const ctrl = component.form.get('purchaseDate');
    ctrl!.setValue(new Date());
    // today should not have future date error
    expect(
      ctrl!.hasError('matDatepickerMax') || ctrl!.hasError('futureDate')
    ).toBeFalse();
  });

  it('categories list contains all 11 category keys', () => {
    const keys = component.categoryKeys;
    expect(keys.length).toBe(11);
    expect(keys).toContain('SMARTFONY');
    expect(keys).toContain('LAPTOPY');
    expect(keys).toContain('INNE');
  });

  it('template renders Polish category labels via pl.categories', () => {
    // Check the pl.categories mapping is used
    expect(pl.categories['SMARTFONY']).toBe('Smartfony');
    expect(pl.categories['SLUCHAWKI']).toBe('Słuchawki');
  });
});

describe('IntakeFormComponent — blocked-submit feedback', () => {
  let fixture: ComponentFixture<IntakeFormComponent>;
  let component: IntakeFormComponent;

  /** Fill in all form controls to produce a fully-valid state (no image). */
  function fillFormValid(): void {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('Dell XPS 13');
    component.form.get('purchaseDate')!.setValue(new Date('2024-01-15'));
    component.form.get('reason')!.setValue('');
    fixture.detectChanges();
  }

  /** Simulate selecting an image file on the component. */
  function attachImage(): void {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    component['applyFile'](file);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntakeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── (a) incomplete submit sets the formIncomplete signal ──────────────────

  it('onSubmit() sets formIncomplete signal when form is invalid', () => {
    // Form is empty by default → invalid
    component.onSubmit();
    expect(component.formIncomplete()).toBeTrue();
  });

  it('onSubmit() sets formIncomplete signal when form is valid but no image attached', () => {
    fillFormValid();
    // No image attached
    component.onSubmit();
    expect(component.formIncomplete()).toBeTrue();
  });

  it('banner element is rendered in the DOM after incomplete submit', () => {
    component.onSubmit();
    fixture.detectChanges();
    const banner: HTMLElement | null = fixture.nativeElement.querySelector('[data-testid="form-incomplete-banner"]');
    expect(banner).toBeTruthy();
  });

  // ── (b) complete submit does NOT set formIncomplete and proceeds ──────────

  it('onSubmit() does NOT set formIncomplete when form valid + image attached', () => {
    const mockCaseApi = TestBed.inject(CaseApiService);
    spyOn(mockCaseApi, 'submit').and.returnValue(of({
      sessionId: 'sess-1',
      caseSummary: { requestType: 'RETURN' as const, category: 'LAPTOPY' as const, model: 'Dell XPS 13', purchaseDate: '2024-01-15' },
      decision: { verdict: 'APPROVE' as const, justification: 'ok', nextSteps: 'none', disclaimer: '', missingInfo: null },
    }));

    fillFormValid();
    attachImage();
    component.onSubmit();

    expect(component.formIncomplete()).toBeFalse();
  });

  // ── (c) banner clears once the form becomes valid again ───────────────────

  it('formIncomplete clears when onSubmit is called on a now-valid form', () => {
    // First call: incomplete → sets signal
    component.onSubmit();
    expect(component.formIncomplete()).toBeTrue();

    // Fix the form + add image, then submit again (mock backend so it proceeds)
    const mockCaseApi = TestBed.inject(CaseApiService);
    spyOn(mockCaseApi, 'submit').and.returnValue(of({
      sessionId: 'sess-1',
      caseSummary: { requestType: 'RETURN' as const, category: 'LAPTOPY' as const, model: 'Dell XPS 13', purchaseDate: '2024-01-15' },
      decision: { verdict: 'APPROVE' as const, justification: 'ok', nextSteps: 'none', disclaimer: '', missingInfo: null },
    }));
    fillFormValid();
    attachImage();
    component.onSubmit();

    expect(component.formIncomplete()).toBeFalse();
  });

  // ── (d) first-invalid control ordering ────────────────────────────────────

  it('getFirstInvalidControlName() returns "requestType" when all controls are empty', () => {
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBe('requestType');
  });

  it('getFirstInvalidControlName() returns "category" when only requestType is set', () => {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBe('category');
  });

  it('getFirstInvalidControlName() returns "model" when requestType + category set', () => {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBe('model');
  });

  it('getFirstInvalidControlName() returns "purchaseDate" when requestType + category + model set', () => {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('MacBook Pro');
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBe('purchaseDate');
  });

  it('getFirstInvalidControlName() returns "reason" when COMPLAINT type and reason is empty', () => {
    component.form.get('requestType')!.setValue('COMPLAINT');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('MacBook Pro');
    component.form.get('purchaseDate')!.setValue(new Date('2024-01-15'));
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBe('reason');
  });

  it('getFirstInvalidControlName() returns "image" when form is valid but no image', () => {
    fillFormValid();
    component.form.markAllAsTouched();
    // No image → image is the only invalid item
    expect(component.getFirstInvalidControlName()).toBe('image');
  });

  it('getFirstInvalidControlName() returns null when form is valid AND image is attached', () => {
    fillFormValid();
    attachImage();
    component.form.markAllAsTouched();
    expect(component.getFirstInvalidControlName()).toBeNull();
  });
});

describe('IntakeFormComponent — reactive banner clearance', () => {
  let fixture: ComponentFixture<IntakeFormComponent>;
  let component: IntakeFormComponent;

  function fillFormValid(): void {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('Dell XPS 13');
    component.form.get('purchaseDate')!.setValue(new Date('2024-01-15'));
    component.form.get('reason')!.setValue('');
    fixture.detectChanges();
  }

  function attachImage(): void {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    component['applyFile'](file);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntakeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── (a) completing the last form field clears the banner reactively ───────

  it('completes form after blocked submit: filling last field clears formIncomplete without resubmitting', () => {
    // All fields except purchaseDate filled — still invalid
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    component.form.get('model')!.setValue('Dell XPS 13');
    attachImage();
    fixture.detectChanges();

    // Blocked submit → banner shown
    component.onSubmit();
    expect(component.formIncomplete()).toBeTrue();

    // Fill the last missing field (purchaseDate) — no resubmit
    component.form.get('purchaseDate')!.setValue(new Date('2024-01-15'));
    fixture.detectChanges();

    // Banner should clear reactively
    expect(component.formIncomplete()).toBeFalse();
  });

  // ── (b) adding a valid image clears the banner reactively ─────────────────

  it('completes form after blocked submit: adding valid image clears formIncomplete without resubmitting', () => {
    // Form completely valid but no image yet
    fillFormValid();

    // Blocked submit (no image) → banner shown
    component.onSubmit();
    expect(component.formIncomplete()).toBeTrue();

    // Now add the image — no resubmit
    attachImage();

    // Banner should clear reactively
    expect(component.formIncomplete()).toBeFalse();
  });

  // ── (c) banner does NOT appear from field edits alone (no prior submit) ───

  it('formIncomplete stays false when fields are edited without any submit attempt', () => {
    // Start with false (initial state)
    expect(component.formIncomplete()).toBeFalse();

    // Edit fields — this should never set formIncomplete
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('category')!.setValue('LAPTOPY');
    fixture.detectChanges();

    expect(component.formIncomplete()).toBeFalse();

    // Fill completely
    fillFormValid();
    attachImage();

    expect(component.formIncomplete()).toBeFalse();
  });
});
