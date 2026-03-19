import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommunityLeaderApplicationPayload } from '../../../pages/Public/pages/communities/models/community-leader-application';

@Component({
  selector: 'app-community-leader-application-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './community-leader-application-modal.html',
  styleUrls: ['./community-leader-application-modal.scss']
})
export class CommunityLeaderApplicationModalComponent implements OnInit {
  @Input() fullName: string = '';
  @Input() email: string = '';
  @Input() phoneNumber: string = '';
  @Input() isSubmitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() submitApplication = new EventEmitter<CommunityLeaderApplicationPayload>();

  private fb = inject(FormBuilder);
  private readonly maxVerificationFileSizeInBytes = 5 * 1024 * 1024;
  private readonly allowedVerificationFileExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

  selectedVerificationFile: File | null = null;
  isDraggingFile = false;
  verificationFileErrorMessage = '';

  readonly locationOptions = [
    'Bronx',
    'Brooklyn',
    'Manhattan',
    'Queens',
    'Staten Island'
  ];

  readonly leaderApplicationForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(7)]],
    communityName: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', Validators.required],
    profileLink: ['', [this.optionalAbsoluteHttpUrlValidator]],
    motivation: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    experience: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    ledBefore: [null as boolean | null, Validators.required],
    weeklyAvailability: ['1-3 hours / week', [Validators.required, Validators.maxLength(500)]],
    agreedToGuidelines: [false, Validators.requiredTrue],
    verificationFile: [null as File | null, Validators.required]
  });

  ngOnInit(): void {
    this.leaderApplicationForm.patchValue({
      fullName: this.fullName || '',
      email: this.email || '',
      phoneNumber: this.phoneNumber || ''
    });
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    if (this.isSubmitting) return;
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.updateSelectedFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (this.isSubmitting) return;
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.isSubmitting) return;
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent): void {
    if (this.isSubmitting) return;
    event.preventDefault();
    this.isDraggingFile = false;
    const file = event.dataTransfer?.files?.[0] || null;
    this.updateSelectedFile(file);
  }

  submit(): void {
    if (this.isSubmitting) return;

    if (!this.selectedVerificationFile || this.leaderApplicationForm.invalid) {
      this.leaderApplicationForm.markAllAsTouched();
      this.leaderApplicationForm.get('verificationFile')?.markAsTouched();
      return;
    }

    const value = this.leaderApplicationForm.getRawValue();
    this.submitApplication.emit({
      fullName: String(value.fullName || '').trim(),
      email: String(value.email || '').trim(),
      phoneNumber: String(value.phoneNumber || '').trim(),
      communityName: String(value.communityName || '').trim(),
      location: String(value.location || '').trim(),
      verificationFile: this.selectedVerificationFile,
      profileLink: String(value.profileLink || '').trim() || undefined,
      motivation: String(value.motivation || '').trim(),
      experience: String(value.experience || '').trim(),
      ledBefore: !!value.ledBefore,
      weeklyAvailability: String(value.weeklyAvailability || '').trim(),
      agreedToGuidelines: !!value.agreedToGuidelines
    });
  }

  hasControlError(controlName: string, errorName?: string): boolean {
    const control = this.leaderApplicationForm.get(controlName);
    if (!control || !control.touched) return false;
    if (!errorName) return control.invalid;
    return control.hasError(errorName);
  }

  private updateSelectedFile(file: File | null): void {
    const verificationFileControl = this.leaderApplicationForm.get('verificationFile');
    if (!verificationFileControl) return;

    if (!file) return;

    const normalizedFileName = file.name.toLowerCase();
    const hasAllowedExtension = this.allowedVerificationFileExtensions.some((extension) =>
      normalizedFileName.endsWith(extension)
    );

    if (!hasAllowedExtension) {
      this.selectedVerificationFile = null;
      this.verificationFileErrorMessage = 'Upload a JPG, PNG, or PDF file.';
      verificationFileControl.setValue(null);
      verificationFileControl.markAsTouched();
      verificationFileControl.setErrors({ invalidFileType: true });
      return;
    }

    if (file.size > this.maxVerificationFileSizeInBytes) {
      this.selectedVerificationFile = null;
      this.verificationFileErrorMessage = 'File size must be 5MB or less.';
      verificationFileControl.setValue(null);
      verificationFileControl.markAsTouched();
      verificationFileControl.setErrors({ fileTooLarge: true });
      return;
    }

    this.selectedVerificationFile = file;
    this.verificationFileErrorMessage = '';
    this.leaderApplicationForm.patchValue({ verificationFile: file });
    verificationFileControl.markAsTouched();
    verificationFileControl.setErrors(null);
    verificationFileControl.updateValueAndValidity();
  }

  private optionalAbsoluteHttpUrlValidator(control: AbstractControl): ValidationErrors | null {
    const rawValue = String(control.value || '').trim();
    if (!rawValue) return null;

    try {
      const url = new URL(rawValue);
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? null
        : { invalidAbsoluteHttpUrl: true };
    } catch {
      return { invalidAbsoluteHttpUrl: true };
    }
  }
}
