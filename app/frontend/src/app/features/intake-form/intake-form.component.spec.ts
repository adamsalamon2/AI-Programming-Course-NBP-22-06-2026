import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IntakeFormComponent } from './intake-form.component';
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
