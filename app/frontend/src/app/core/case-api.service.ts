import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  CaseResponse,
  RequestType,
  Category,
  FieldError,
} from './models';

export interface IntakeFormData {
  requestType: RequestType;
  category: Category;
  model: string;
  purchaseDate: string; // yyyy-MM-dd
  reason?: string;
  imageFile: File;
}

/** Structured validation error carrying field-level errors from the backend */
export interface ValidationError {
  type: 'validation';
  message: string;
  fieldErrors: FieldError[];
}

/** Retryable error for 502/503 */
export interface RetryableServiceError {
  retryable: true;
  message: string;
}

/**
 * CaseApiService — submits the intake form as multipart/form-data to POST /api/cases.
 * Maps 400 field errors into ValidationError; maps 502/503 into RetryableServiceError.
 */
@Injectable({ providedIn: 'root' })
export class CaseApiService {
  private readonly endpoint = '/api/cases';

  constructor(private readonly http: HttpClient) {}

  submit(form: IntakeFormData, sessionId: string): Observable<CaseResponse> {
    const body = new FormData();
    body.append('requestType', form.requestType);
    body.append('category', form.category);
    body.append('model', form.model);
    body.append('purchaseDate', form.purchaseDate);
    body.append('sessionId', sessionId);
    if (form.reason) {
      body.append('reason', form.reason);
    }
    body.append('image', form.imageFile);

    return this.http.post<CaseResponse>(this.endpoint, body).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  private handleError(
    err: HttpErrorResponse
  ): Observable<never> {
    if (err.status === 400) {
      const apiError = err.error as {
        code?: string;
        message?: string;
        fieldErrors?: FieldError[];
      };
      const validationError: ValidationError = {
        type: 'validation',
        message: apiError?.message ?? 'Błąd walidacji',
        fieldErrors: apiError?.fieldErrors ?? [],
      };
      return throwError(() => validationError);
    }

    if (err.status === 502 || err.status === 503) {
      const retryable: RetryableServiceError = {
        retryable: true,
        message: 'Usługa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
      };
      return throwError(() => retryable);
    }

    return throwError(() => ({
      retryable: false,
      message: 'Wystąpił błąd. Spróbuj ponownie.',
    }));
  }
}
