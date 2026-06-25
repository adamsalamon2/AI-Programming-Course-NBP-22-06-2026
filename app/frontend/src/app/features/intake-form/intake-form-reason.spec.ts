import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { IntakeFormComponent } from './intake-form.component';

describe('IntakeFormComponent — reason required toggle', () => {
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

  it('reason is not required when requestType is RETURN', () => {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('reason')!.setValue('');
    component.form.get('reason')!.markAsTouched();
    expect(component.form.get('reason')!.hasError('required')).toBeFalse();
  });

  it('reason is required when requestType is COMPLAINT', () => {
    component.form.get('requestType')!.setValue('COMPLAINT');
    component.form.get('reason')!.setValue('');
    component.form.get('reason')!.markAsTouched();
    expect(component.form.get('reason')!.hasError('required')).toBeTrue();
  });

  it('switching from COMPLAINT to RETURN makes reason optional and clears required error', () => {
    component.form.get('requestType')!.setValue('COMPLAINT');
    component.form.get('reason')!.setValue('');
    component.form.get('reason')!.markAsTouched();
    expect(component.form.get('reason')!.hasError('required')).toBeTrue();

    // Switch to RETURN
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('reason')!.setValue('');
    expect(component.form.get('reason')!.hasError('required')).toBeFalse();
  });

  it('switching from RETURN to COMPLAINT makes reason required', () => {
    component.form.get('requestType')!.setValue('RETURN');
    component.form.get('reason')!.setValue('');
    expect(component.form.get('reason')!.hasError('required')).toBeFalse();

    component.form.get('requestType')!.setValue('COMPLAINT');
    component.form.get('reason')!.setValue('');
    expect(component.form.get('reason')!.hasError('required')).toBeTrue();
  });

  it('reason valid with content when COMPLAINT', () => {
    component.form.get('requestType')!.setValue('COMPLAINT');
    component.form.get('reason')!.setValue('Urządzenie nie działa');
    expect(component.form.get('reason')!.valid).toBeTrue();
  });

  it('isReasonRequired() returns true for COMPLAINT', () => {
    component.form.get('requestType')!.setValue('COMPLAINT');
    expect(component.isReasonRequired()).toBeTrue();
  });

  it('isReasonRequired() returns false for RETURN', () => {
    component.form.get('requestType')!.setValue('RETURN');
    expect(component.isReasonRequired()).toBeFalse();
  });
});
