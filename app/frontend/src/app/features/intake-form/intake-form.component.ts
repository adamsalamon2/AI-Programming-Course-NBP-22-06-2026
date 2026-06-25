import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { pl } from '../../i18n/pl';
import type { Category, RequestType } from '../../core/models';
import { CaseApiService, type IntakeFormData } from '../../core/case-api.service';
import { SessionState } from '../../core/session-state';

/** Custom validator: date must not be in the future */
function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = control.value instanceof Date ? control.value : new Date(control.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-intake-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './intake-form.component.html',
  styleUrl: './intake-form.component.scss',
})
export class IntakeFormComponent implements OnInit, OnDestroy {
  readonly labels = pl;
  readonly today = new Date();

  /** All 11 category keys in order */
  readonly categoryKeys = Object.keys(pl.categories) as Category[];

  form!: FormGroup;

  /** Currently selected image file */
  readonly selectedImage = signal<File | null>(null);
  /** Data URL for thumbnail preview */
  readonly imagePreview = signal<string | null>(null);
  /** Inline image error message */
  readonly imageError = signal<string | null>(null);

  /** Whether a submission is in-progress */
  readonly submitting = signal(false);
  /** Retryable backend error message */
  readonly submitError = signal<string | null>(null);

  private subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly caseApi: CaseApiService,
    private readonly session: SessionState,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      requestType: [null as RequestType | null, Validators.required],
      category: [null as Category | null, Validators.required],
      model: ['', Validators.required],
      purchaseDate: [null as Date | null, [Validators.required, notFutureDateValidator]],
      reason: [''],
    });

    // React to request type changes to update reason required state
    const sub = this.form.get('requestType')!.valueChanges.subscribe((type) => {
      this.updateReasonValidators(type);
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Returns true when reason is required (COMPLAINT type selected) */
  isReasonRequired(): boolean {
    return this.requestTypeCtrl.value === 'COMPLAINT';
  }

  private updateReasonValidators(type: RequestType | null): void {
    const reasonCtrl = this.form.get('reason')!;
    if (type === 'COMPLAINT') {
      reasonCtrl.setValidators(Validators.required);
    } else {
      reasonCtrl.clearValidators();
      // Clear stale required error when switching away from COMPLAINT
      const errors = reasonCtrl.errors;
      if (errors) {
        const { required: _removed, ...remaining } = errors;
        reasonCtrl.setErrors(Object.keys(remaining).length ? remaining : null);
      }
    }
    reasonCtrl.updateValueAndValidity({ emitEvent: false });
  }

  get requestTypeCtrl() { return this.form.get('requestType')!; }
  get categoryCtrl()    { return this.form.get('category')!; }
  get modelCtrl()       { return this.form.get('model')!; }
  get purchaseDateCtrl(){ return this.form.get('purchaseDate')!; }
  get reasonCtrl()      { return this.form.get('reason')!; }

  /** Category label from the pl map */
  categoryLabel(key: Category): string {
    return pl.categories[key];
  }

  // ── Image handling ──────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // allow re-selecting same file
    this.applyFile(file);
  }

  private applyFile(file: File | null): void {
    this.imageError.set(null);
    if (!file) {
      this.selectedImage.set(null);
      this.imagePreview.set(null);
      return;
    }

    const accepted = ['image/jpeg', 'image/png', 'image/webp'];
    if (!accepted.includes(file.type)) {
      this.imageError.set(pl.errors.imageFormatInvalid);
      this.selectedImage.set(null);
      this.imagePreview.set(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      this.imageError.set(pl.errors.imageTooLarge);
      this.selectedImage.set(null);
      this.imagePreview.set(null);
      return;
    }

    this.selectedImage.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.imageError.set(null);
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (!this.selectedImage()) {
      this.imageError.set(pl.errors.imageRequired);
    }

    if (this.form.invalid || !this.selectedImage()) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.form.disable({ emitEvent: false });

    this.session.initSession();
    const sessionId = this.session.sessionId()!;

    const formData: IntakeFormData = {
      requestType: this.requestTypeCtrl.value,
      category: this.categoryCtrl.value,
      model: this.modelCtrl.value,
      purchaseDate: this.formatDate(this.purchaseDateCtrl.value),
      reason: this.reasonCtrl.value || undefined,
      imageFile: this.selectedImage()!,
    };

    this.caseApi.submit(formData, sessionId).subscribe({
      next: (response) => {
        this.session.setCaseSummary(response.caseSummary);
        this.session.storeDecision(response.decision);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        if (err?.type === 'validation' && err?.fieldErrors) {
          this.applyFieldErrors(err.fieldErrors);
        } else {
          this.submitError.set(pl.errors.retryable);
        }
      },
    });
  }

  private applyFieldErrors(fieldErrors: Array<{ field: string; message: string }>): void {
    for (const fe of fieldErrors) {
      const ctrl = this.form.get(fe.field);
      if (ctrl) {
        ctrl.setErrors({ serverError: fe.message });
      }
    }
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
