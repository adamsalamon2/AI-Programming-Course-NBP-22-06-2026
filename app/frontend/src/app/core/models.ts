/**
 * Domain models matching the backend API contract exactly.
 * Mirror the frozen API contract — do not drift.
 */

/** Request type enum keys — sent to backend as-is */
export type RequestType = 'COMPLAINT' | 'RETURN';

/** Equipment category enum keys — sent to backend as-is */
export type Category =
  | 'SMARTFONY'
  | 'LAPTOPY'
  | 'TABLETY'
  | 'TELEWIZORY'
  | 'SLUCHAWKI'
  | 'SMARTWATCHE'
  | 'KONSOLE'
  | 'AUDIO'
  | 'APARATY'
  | 'AKCESORIA'
  | 'INNE';

/** Decision verdict values returned by the backend */
export type Verdict = 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW';

/** Decision object from the backend */
export interface Decision {
  verdict: Verdict;
  justification: string;
  nextSteps: string;
  disclaimer: string;
  missingInfo: string | null;
}

/** Case summary returned by the backend */
export interface CaseSummary {
  requestType: RequestType;
  category: Category;
  model: string;
  purchaseDate: string; // yyyy-MM-dd
}

/** Full response from POST /api/cases */
export interface CaseResponse {
  sessionId: string;
  decision: Decision;
  caseSummary: CaseSummary;
}

/** View model for a chat message displayed in the UI */
export interface ChatMessageVM {
  role: 'assistant' | 'user';
  /** String content for user messages; mutable string for assistant streaming */
  content: string;
  /** True while the assistant is still streaming tokens for this message */
  streaming?: boolean;
}

/** Backend 400 field error */
export interface FieldError {
  field: string;
  message: string;
}

/** Backend 400 error body */
export interface ApiErrorResponse {
  code: string;
  message: string;
  fieldErrors: FieldError[];
}

/** Mapped retryable error for 502/503 */
export interface RetryableError {
  retryable: true;
  message: string;
}
