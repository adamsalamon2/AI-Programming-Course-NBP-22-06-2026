import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CaseApiService } from './case-api.service';
import type { CaseResponse } from './models';

describe('CaseApiService', () => {
  let service: CaseApiService;
  let httpMock: HttpTestingController;

  const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

  const mockForm = {
    requestType: 'COMPLAINT' as const,
    category: 'SMARTFONY' as const,
    model: 'iPhone 15',
    purchaseDate: '2025-01-15',
    reason: 'Ekran przestał działać',
    imageFile: mockFile,
  };

  const mockResponse: CaseResponse = {
    sessionId: 'test-session-id',
    decision: {
      verdict: 'APPROVE',
      justification: 'Wada produkcyjna.',
      nextSteps: 'Dostarcz urządzenie do serwisu.',
      disclaimer: 'To jest opinia doradcza.',
      missingInfo: null,
    },
    caseSummary: {
      requestType: 'COMPLAINT',
      category: 'SMARTFONY',
      model: 'iPhone 15',
      purchaseDate: '2025-01-15',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CaseApiService,
      ],
    });
    service = TestBed.inject(CaseApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends multipart POST to /api/cases with correct fields', () => {
    service.submit(mockForm, 'test-session-id').subscribe();

    const req = httpMock.expectOne('/api/cases');
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body.get('requestType')).toBe('COMPLAINT');
    expect(body.get('category')).toBe('SMARTFONY');
    expect(body.get('model')).toBe('iPhone 15');
    expect(body.get('purchaseDate')).toBe('2025-01-15');
    expect(body.get('sessionId')).toBe('test-session-id');
    expect(body.get('image')).toBe(mockFile);

    req.flush(mockResponse);
  });

  it('includes reason when provided', () => {
    service.submit(mockForm, 'test-session-id').subscribe();
    const req = httpMock.expectOne('/api/cases');
    const body = req.request.body as FormData;
    expect(body.get('reason')).toBe('Ekran przestał działać');
    req.flush(mockResponse);
  });

  it('omits reason field when not provided', () => {
    const formWithoutReason = { ...mockForm, reason: undefined };
    service.submit(formWithoutReason, 'test-session-id').subscribe();
    const req = httpMock.expectOne('/api/cases');
    const body = req.request.body as FormData;
    expect(body.get('reason')).toBeNull();
    req.flush(mockResponse);
  });

  it('returns parsed CaseResponse on 200', (done) => {
    service.submit(mockForm, 'test-session-id').subscribe((result) => {
      expect(result).toEqual(mockResponse);
      done();
    });
    httpMock.expectOne('/api/cases').flush(mockResponse);
  });

  it('maps 400 fieldErrors to a ValidationError', (done) => {
    const errorBody = {
      code: 'VALIDATION_ERROR',
      message: 'Błąd walidacji',
      fieldErrors: [
        { field: 'model', message: 'Pole wymagane' },
        { field: 'category', message: 'Wybierz kategorię' },
      ],
    };

    service.submit(mockForm, 'test-session-id').subscribe({
      error: (err) => {
        expect(err.type).toBe('validation');
        expect(err.fieldErrors).toBeDefined();
        expect(err.fieldErrors.length).toBe(2);
        expect(err.fieldErrors[0].field).toBe('model');
        done();
      },
    });

    httpMock.expectOne('/api/cases').flush(errorBody, {
      status: 400,
      statusText: 'Bad Request',
    });
  });

  it('maps 502 to a retryable error', (done) => {
    service.submit(mockForm, 'test-session-id').subscribe({
      error: (err) => {
        expect(err.retryable).toBe(true);
        done();
      },
    });

    httpMock.expectOne('/api/cases').flush('Bad Gateway', {
      status: 502,
      statusText: 'Bad Gateway',
    });
  });

  it('maps 503 to a retryable error', (done) => {
    service.submit(mockForm, 'test-session-id').subscribe({
      error: (err) => {
        expect(err.retryable).toBe(true);
        done();
      },
    });

    httpMock.expectOne('/api/cases').flush('Service Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  });
});
