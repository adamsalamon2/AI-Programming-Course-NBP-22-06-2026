import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { IntakeFormComponent } from './intake-form.component';
import type { CaseResponse } from '../../core/models';

function mockFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

function fillValidForm(component: IntakeFormComponent): void {
  component.form.get('requestType')!.setValue('RETURN');
  component.form.get('category')!.setValue('LAPTOPY');
  component.form.get('model')!.setValue('Dell XPS');
  component.form.get('purchaseDate')!.setValue(new Date(2024, 0, 1));
  component['applyFile'](mockFile('photo.jpg', 'image/jpeg'));
}

const mockResponse: CaseResponse = {
  sessionId: 'server-session-id',
  decision: {
    verdict: 'APPROVE',
    justification: 'Brak śladów użytkowania.',
    nextSteps: 'Wyślij paczkę.',
    disclaimer: 'Opinia doradcza.',
    missingInfo: null,
  },
  caseSummary: {
    requestType: 'RETURN',
    category: 'LAPTOPY',
    model: 'Dell XPS',
    purchaseDate: '2024-01-01',
  },
};

describe('IntakeFormComponent — submit lock + navigation', () => {
  let fixture: ComponentFixture<IntakeFormComponent>;
  let component: IntakeFormComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([{ path: 'chat', component: IntakeFormComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntakeFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('form locks (disabled) while request is in-flight', () => {
    fillValidForm(component);
    component.onSubmit();
    expect(component.submitting()).toBeTrue();
    expect(component.form.disabled).toBeTrue();
    httpMock.expectOne('/api/cases').flush(mockResponse);
  });

  it('navigates to /chat on successful response', async () => {
    fillValidForm(component);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.onSubmit();
    httpMock.expectOne('/api/cases').flush(mockResponse);
    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/chat']);
  });

  it('unlocks form on retryable error (502)', () => {
    fillValidForm(component);
    component.onSubmit();
    expect(component.form.disabled).toBeTrue();
    httpMock.expectOne('/api/cases').flush('Bad Gateway', {
      status: 502,
      statusText: 'Bad Gateway',
    });
    expect(component.submitting()).toBeFalse();
    expect(component.form.enabled).toBeTrue();
    expect(component.submitError()).toBeTruthy();
  });

  it('maps 400 fieldErrors back onto form controls', () => {
    fillValidForm(component);
    component.onSubmit();
    httpMock.expectOne('/api/cases').flush(
      {
        code: 'VALIDATION_ERROR',
        message: 'Błąd',
        fieldErrors: [{ field: 'model', message: 'Pole wymagane' }],
      },
      { status: 400, statusText: 'Bad Request' }
    );
    expect(component.form.get('model')!.hasError('serverError')).toBeTrue();
  });

  it('does not submit when form is invalid', () => {
    // Leave form empty
    component.onSubmit();
    httpMock.expectNone('/api/cases');
  });
});
