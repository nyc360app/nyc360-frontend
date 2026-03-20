
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VerificationService } from '../../../pages/Public/pages/settings/services/verification.service';
import { ToastService } from '../../../shared/services/toast.service';
import { filterPublicCommunityBadges } from '../../utils/community-badge-policy';
import { AuthService } from '../../../pages/Authentication/Service/auth';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verification-modal.html',
  styleUrls: ['./verification-modal.scss']
})
export class VerificationModalComponent implements OnInit {
  @Input() categoryName: string = 'Housing';
  @Input() categoryId: number = 4; // Default to Housing
  @Output() close = new EventEmitter<void>();
  @Output() verified = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private verificationService = inject(VerificationService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  private readonly pendingRequestsStorageKey = 'nyc360_pending_tag_verification_requests';

  verificationForm!: FormGroup;
  isSubmittingVerification = false;
  selectedDocFile: File | null = null;

  @Input() extraOccupations: any[] = [];

  private readonly defaultOccupations: any[] = [
    { id: 1854, name: 'Housing Advisor' },
    { id: 1855, name: 'Housing Organization' },
    { id: 1856, name: 'Licensed Agent' }
  ];
  occupations: any[] = [];

  documentTypes = [
    { id: 1, name: 'Government ID' },
    { id: 2, name: 'Utility Bill' },
    { id: 5, name: 'Professional License' },
    { id: 6, name: 'Employee ID Card' },
    { id: 11, name: 'Contract Agreement' },
    { id: 12, name: 'Letter of Recommendation' },
    { id: 99, name: 'Other' }
  ];

  get isCommunityPolicyMode(): boolean {
    return (this.categoryName || '').trim().toLowerCase() === 'community';
  }

  ngOnInit() {
    const sourceOccupations = this.resolveOccupations();

    // Community membership tags are internal and should never appear as public badge options.
    // Community D01 roles must come from backend tags, not hardcoded frontend IDs.
    this.occupations = this.dedupeById(
      this.normalizeOccupations(filterPublicCommunityBadges(sourceOccupations))
    );

    this.initForm(this.getInitialOccupationId());
  }

  initForm(initialOccupationId: number | null) {
    this.verificationForm = this.fb.group({
      occupationId: [initialOccupationId, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      documentType: [1, Validators.required],
      file: [null, Validators.required]
    });
  }

  private dedupeById(items: any[]): any[] {
    return items.filter((item, index, arr) => {
      const key = `${item.id}::${item.name}`;
      return arr.findIndex((x) => `${x.id}::${x.name}` === key) === index;
    });
  }

  private resolveOccupations(): any[] {
    if (Array.isArray(this.extraOccupations) && this.extraOccupations.length > 0) {
      return this.extraOccupations;
    }

    if (this.isCommunityPolicyMode) {
      return [];
    }

    return this.defaultOccupations;
  }

  private normalizeOccupations(items: any[]): any[] {
    return items
      .map((item) => {
        const id = Number(item?.id ?? item?.Id);
        const rawName = (item?.name ?? item?.Name ?? '').toString().trim();
        const name = this.toDisplayOccupationName(rawName);
        return { id, name };
      })
      .filter((item) => Number.isFinite(item.id) && !!item.name);
  }

  private toDisplayOccupationName(name: string): string {
    if (!name) return '';

    // Division badges can arrive as technical labels like "D01.1 ..." or "D08.0.1 ...".
    // Strip only the stable machine prefix and keep the user-facing role text.
    const normalizedName = name.replace(/^[A-Z]\d{2}(?:\.\d+)+\s*[-:.]?\s*/i, '').trim();
    return normalizedName || name;
  }

  private getInitialOccupationId(): number | null {
    if (!this.occupations.length) return null;

    const preferredId = this.isCommunityPolicyMode ? 2000 : 1856;
    const hasPreferred = this.occupations.some((occ) => occ.id === preferredId);
    if (hasPreferred) return preferredId;

    return this.occupations[0]?.id ?? null;
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedDocFile = event.target.files[0];
      this.verificationForm.patchValue({ file: this.selectedDocFile });
    }
  }

  submitVerification() {
    if (!this.occupations.length) {
      this.toastService.error('No public badges are available for this request right now.');
      return;
    }

    if (this.verificationForm.invalid || !this.selectedDocFile) {
      this.verificationForm.markAllAsTouched();
      this.toastService.error('Please complete the required fields and upload a supporting document.');
      this.scrollToFirstInvalidField();
      return;
    }

    const selectedTagId = Number(this.verificationForm.value.occupationId);

    if (this.hasApprovedAccess(selectedTagId)) {
      this.toastService.info('You already have access for this role.');
      return;
    }

    if (this.hasPendingRequest(selectedTagId)) {
      this.toastService.info('You already submitted a request for this role.');
      return;
    }

    this.isSubmittingVerification = true;
    const data = {
      TagId: selectedTagId,
      Reason: this.verificationForm.value.reason,
      DocumentType: this.verificationForm.value.documentType,
      File: this.selectedDocFile
    };

    this.verificationService.submitVerification(data).subscribe({
      next: (res: any) => {
        this.isSubmittingVerification = false;
        if (res.isSuccess || res.IsSuccess) {
          this.storePendingRequest(selectedTagId);
          this.toastService.success('Verification request submitted successfully!');
          this.verified.emit();
          this.closeModal();
        } else {
          const errorMessage = res.error?.message || res.Error?.Message || 'Submission failed';
          if (this.isDuplicateSubmissionMessage(errorMessage)) {
            this.storePendingRequest(selectedTagId);
            this.toastService.info('You already submitted a request for this role.');
            this.closeModal();
            return;
          }
          this.toastService.error(errorMessage);
        }
      },
      error: () => {
        this.isSubmittingVerification = false;
        this.toastService.error('Network error. Please try again.');
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  private hasApprovedAccess(tagId: number): boolean {
    const fullUserInfo = this.authService.getFullUserInfo();
    const hasApprovedTag = !!fullUserInfo?.tags?.some((tag) => Number(tag.id) === tagId);

    if (hasApprovedTag) {
      this.clearPendingRequest(tagId);
    }

    return hasApprovedTag;
  }

  private hasPendingRequest(tagId: number): boolean {
    const userId = this.authService.getUserId();
    if (!userId || typeof window === 'undefined') return false;

    return this.getStoredPendingRequests().some((request) =>
      request.userId === userId && request.tagId === tagId
    );
  }

  private storePendingRequest(tagId: number): void {
    const userId = this.authService.getUserId();
    if (!userId || typeof window === 'undefined') return;

    const requests = this.getStoredPendingRequests();
    const alreadyExists = requests.some((request) => request.userId === userId && request.tagId === tagId);

    if (alreadyExists) return;

    requests.push({
      userId,
      tagId,
      submittedAt: new Date().toISOString()
    });

    localStorage.setItem(this.pendingRequestsStorageKey, JSON.stringify(requests));
  }

  private clearPendingRequest(tagId: number): void {
    const userId = this.authService.getUserId();
    if (!userId || typeof window === 'undefined') return;

    const nextRequests = this.getStoredPendingRequests().filter((request) =>
      !(request.userId === userId && request.tagId === tagId)
    );

    localStorage.setItem(this.pendingRequestsStorageKey, JSON.stringify(nextRequests));
  }

  private getStoredPendingRequests(): Array<{ userId: number; tagId: number; submittedAt: string }> {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(this.pendingRequestsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private isDuplicateSubmissionMessage(message: string): boolean {
    const normalized = (message || '').toLowerCase();
    return normalized.includes('already submitted')
      || normalized.includes('already requested')
      || normalized.includes('already exists')
      || normalized.includes('pending');
  }

  private scrollToFirstInvalidField(): void {
    if (typeof document === 'undefined') return;

    setTimeout(() => {
      const firstInvalid = document.querySelector(
        '.verification-modal .ng-invalid, .verification-modal .file-upload-wrapper'
      ) as HTMLElement | null;

      firstInvalid?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }
}
