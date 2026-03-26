import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BadgeOption, isCommunityCreateTag, isCommunityLeaderTag, isCommunityOrganizationTag } from '../../utils/community-badge-policy';
import { CommunityLeaderApplicationPayload } from '../../../pages/Public/pages/communities/models/community-leader-application';
import { CommunityService, LocationDto } from '../../../pages/Public/pages/communities/services/community';
import { ToastService } from '../../services/toast.service';
import { getCommunityErrorMessage } from '../../utils/community-contract';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

type CommunityOccupationOption = {
  id: number;
  name: string;
  label: string;
};

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
  @Input() availableOccupations: BadgeOption[] = [];
  @Input() preferredOccupationId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() verified = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private communityService = inject(CommunityService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private readonly maxVerificationFileSizeInBytes = 5 * 1024 * 1024;
  private readonly allowedVerificationFileExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

  private internalSubmitting = signal(false);
  selectedOccupation(): CommunityOccupationOption | null {
    const selectedId = Number(this.leaderApplicationForm.get('occupationId')?.value || 0);
    return this.occupationOptions.find((option) => option.id === selectedId) || null;
  }

  selectedVerificationFile: File | null = null;
  isDraggingFile = false;
  verificationFileErrorMessage = '';
  occupationOptions: CommunityOccupationOption[] = [];
  locationResults: LocationDto[] = [];
  selectedLocation: LocationDto | null = null;
  isSearchingLocation = false;
  showLocationResults = false;

  readonly leaderApplicationForm = this.fb.group({
    occupationId: [null as number | null, Validators.required],
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
    this.occupationOptions = this.normalizeOccupations(this.availableOccupations);

    if (!this.occupationOptions.length) {
      this.occupationOptions = [
        {
          id: 2000,
          name: 'Apply for Community Leader Badges',
          label: 'Community Leader'
        }
      ];
    }

    const initialOccupationId = this.resolveInitialOccupationId();
    this.leaderApplicationForm.patchValue({
      occupationId: initialOccupationId,
      fullName: this.fullName || '',
      email: this.email || '',
      phoneNumber: this.phoneNumber || ''
    });

    this.setupLocationSearch();
  }

  get isBusy(): boolean {
    return this.isSubmitting || this.internalSubmitting();
  }

  get showOccupationSelector(): boolean {
    return this.occupationOptions.length > 1;
  }

  get modalTitle(): string {
    const selected = this.selectedOccupation();
    if (!selected) {
      return 'Apply for Community Contributor Access';
    }

    if (this.isLeaderOccupation(selected)) {
      return 'Apply for Community Leader';
    }

    if (this.isCreateOccupation(selected)) {
      return 'Apply for Community Creation Access';
    }

    if (this.isOrganizationOccupation(selected)) {
      return 'Apply for Community Organization Listing';
    }

    return `Apply for ${selected.label}`;
  }

  get roleSelectorLabel(): string {
    return this.showOccupationSelector ? 'Select occupation' : 'Selected occupation';
  }

  get communityNameLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Organization / Community Name';
    }

    return 'Community Name';
  }

  get detailsSectionTitle(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Organization Details';
    }

    return 'Community Details';
  }

  get profileLinkLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Organization / Public Link';
    }

    return 'Profile / Social Link';
  }

  get motivationLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isCreateOccupation(selected)) {
      return 'Why do you want to create this community?';
    }

    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Why should this organization be represented in THE360 SPACE?';
    }

    return 'Why do you want to lead this community?';
  }

  get experienceLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Describe the organization or listing experience relevant to this request';
    }

    return 'Describe any relevant community or leadership experience';
  }

  get leadHistoryLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isCreateOccupation(selected)) {
      return 'Have you organized or managed a community before?';
    }

    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Have you represented or managed an organization before?';
    }

    return 'Have you led a community group before?';
  }

  get availabilityLabel(): string {
    const selected = this.selectedOccupation();
    if (selected && this.isOrganizationOccupation(selected)) {
      return 'Weekly availability to manage this organization request';
    }

    if (selected && this.isCreateOccupation(selected)) {
      return 'Weekly availability to launch and manage this community';
    }

    return 'Weekly moderation availability';
  }

  closeModal(): void {
    if (this.isBusy) return;
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    if (this.isBusy) return;
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.updateSelectedFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (this.isBusy) return;
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.isBusy) return;
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent): void {
    if (this.isBusy) return;
    event.preventDefault();
    this.isDraggingFile = false;
    const file = event.dataTransfer?.files?.[0] || null;
    this.updateSelectedFile(file);
  }

  onLocationFocus(): void {
    const term = this.getLocationControlValue();
    if (!this.selectedLocation && term.length >= 2) {
      this.showLocationResults = true;
    }
  }

  onLocationBlur(): void {
    setTimeout(() => {
      this.showLocationResults = false;
    }, 180);
  }

  onLocationSelect(location: LocationDto): void {
    if (this.isBusy) return;

    this.selectedLocation = location;
    this.locationResults = [];
    this.showLocationResults = false;
    this.isSearchingLocation = false;

    const locationControl = this.leaderApplicationForm.get('location');
    locationControl?.setValue(this.formatLocationDisplayValue(location), { emitEvent: false });
    this.clearLocationSelectionError();
    locationControl?.markAsDirty();
    locationControl?.markAsTouched();
  }

  selectOccupation(occupationId: number): void {
    if (this.isBusy) return;
    this.leaderApplicationForm.patchValue({ occupationId });
    this.leaderApplicationForm.get('occupationId')?.markAsTouched();
  }

  submit(): void {
    if (this.isBusy) return;

    if (!this.selectedLocation && this.getLocationControlValue()) {
      this.setLocationSelectionError();
    }

    if (!this.selectedVerificationFile || this.leaderApplicationForm.invalid || !this.selectedLocation) {
      this.leaderApplicationForm.markAllAsTouched();
      this.leaderApplicationForm.get('verificationFile')?.markAsTouched();
      return;
    }

    const value = this.leaderApplicationForm.getRawValue();
    const selectedOccupation = this.selectedOccupation();
    if (!selectedOccupation) {
      this.toastService.error('Select a contributor role before submitting.');
      return;
    }

    const payload: CommunityLeaderApplicationPayload = {
      occupationId: selectedOccupation.id,
      occupationName: selectedOccupation.name,
      fullName: String(value.fullName || '').trim(),
      email: String(value.email || '').trim(),
      phoneNumber: String(value.phoneNumber || '').trim(),
      communityName: String(value.communityName || '').trim(),
      location: this.formatLocationSubmissionValue(this.selectedLocation),
      verificationFile: this.selectedVerificationFile,
      profileLink: String(value.profileLink || '').trim() || undefined,
      motivation: String(value.motivation || '').trim(),
      experience: String(value.experience || '').trim(),
      ledBefore: !!value.ledBefore,
      weeklyAvailability: String(value.weeklyAvailability || '').trim(),
      agreedToGuidelines: !!value.agreedToGuidelines
    };

    this.internalSubmitting.set(true);

    this.communityService.submitCommunityContributorApplication(payload).subscribe({
      next: (res: any) => {
        this.internalSubmitting.set(false);

        if (res?.isSuccess || res?.IsSuccess) {
          const status = String(res?.data?.status || 'Pending').trim();
          this.toastService.success(this.getSuccessMessage(selectedOccupation, status));
          this.verified.emit();
          this.close.emit();
          return;
        }

        this.toastService.error(getCommunityErrorMessage(res, 'Unable to submit the contributor application.'));
      },
      error: (error: any) => {
        this.internalSubmitting.set(false);
        this.toastService.error(getCommunityErrorMessage(error, 'Unable to submit the contributor application.'));
      }
    });
  }

  hasControlError(controlName: string, errorName?: string): boolean {
    const control = this.leaderApplicationForm.get(controlName);
    if (!control || !control.touched) return false;
    if (!errorName) return control.invalid;
    return control.hasError(errorName);
  }

  private resolveInitialOccupationId(): number | null {
    if (this.preferredOccupationId && this.occupationOptions.some((item) => item.id === this.preferredOccupationId)) {
      return this.preferredOccupationId;
    }

    return this.occupationOptions[0]?.id ?? null;
  }

  private normalizeOccupations(items: BadgeOption[]): CommunityOccupationOption[] {
    return (Array.isArray(items) ? items : [])
      .map((item) => {
        const id = Number(item?.id);
        const name = String(item?.name || '').trim();
        if (!Number.isFinite(id) || !name) return null;

        return {
          id,
          name,
          label: this.toDisplayOccupationName(name)
        };
      })
      .filter((item): item is CommunityOccupationOption => !!item);
  }

  private toDisplayOccupationName(name: string): string {
    if (isCommunityLeaderTag({ name })) return 'Community Leader';
    if (isCommunityCreateTag({ name })) return 'Create Community';
    if (isCommunityOrganizationTag({ name })) return 'Community Organization Listing';
    return name.replace(/^[A-Z]\d{2}(?:\.\d+)+\s*[-:.]?\s*/i, '').trim() || name;
  }

  private isLeaderOccupation(occupation: CommunityOccupationOption | null): boolean {
    return !!occupation && isCommunityLeaderTag({ id: occupation.id, name: occupation.name });
  }

  private isCreateOccupation(occupation: CommunityOccupationOption | null): boolean {
    return !!occupation && isCommunityCreateTag({ id: occupation.id, name: occupation.name });
  }

  private isOrganizationOccupation(occupation: CommunityOccupationOption | null): boolean {
    return !!occupation && isCommunityOrganizationTag({ id: occupation.id, name: occupation.name });
  }

  private getSuccessMessage(selectedOccupation: CommunityOccupationOption, status: string): string {
    if (this.isLeaderOccupation(selectedOccupation)) {
      return `Community leader application submitted. Status: ${status}.`;
    }

    return `${selectedOccupation.label} request submitted successfully.`;
  }

  private setupLocationSearch(): void {
    const locationControl = this.leaderApplicationForm.get('location');
    if (!locationControl) {
      return;
    }

    locationControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((value) => {
          const term = String(value || '').trim();
          this.clearLocationSelectionError();

          if (this.selectedLocation && term === this.formatLocationDisplayValue(this.selectedLocation)) {
            this.clearLocationSelectionError();
            this.locationResults = [];
            this.showLocationResults = false;
            this.isSearchingLocation = false;
            return of({ isSuccess: true, data: [] as LocationDto[] });
          }

          if (this.selectedLocation && term !== this.formatLocationDisplayValue(this.selectedLocation)) {
            this.selectedLocation = null;
          }

          if (term.length < 2) {
            this.locationResults = [];
            this.showLocationResults = false;
            this.isSearchingLocation = false;
            return of({ isSuccess: true, data: [] as LocationDto[] });
          }

          this.isSearchingLocation = true;
          this.showLocationResults = true;

          return this.communityService.searchLocations(term, 8).pipe(
            catchError(() => of({ isSuccess: false, data: [] as LocationDto[] }))
          );
        })
      )
      .subscribe((response) => {
        this.isSearchingLocation = false;
        this.locationResults = response?.isSuccess ? (response.data || []) : [];
        this.showLocationResults = this.getLocationControlValue().length >= 2;
      });
  }

  private getLocationControlValue(): string {
    return String(this.leaderApplicationForm.get('location')?.value || '').trim();
  }

  private formatLocationDisplayValue(location: LocationDto): string {
    const neighborhood = String(location?.neighborhood || '').trim();
    const borough = String(location?.borough || '').trim();
    const zipCode = String(location?.zipCode || '').trim();

    const primary = neighborhood && neighborhood.toLowerCase() !== borough.toLowerCase()
      ? `${neighborhood}, ${borough}`
      : borough || neighborhood;

    return zipCode ? `${primary} (${zipCode})` : primary;
  }

  private formatLocationSubmissionValue(location: LocationDto): string {
    const neighborhood = String(location?.neighborhood || '').trim();
    const borough = String(location?.borough || '').trim();

    if (neighborhood && borough && neighborhood.toLowerCase() !== borough.toLowerCase()) {
      return `${neighborhood}, ${borough}`;
    }

    return borough || neighborhood;
  }

  private setLocationSelectionError(): void {
    const locationControl = this.leaderApplicationForm.get('location');
    if (!locationControl) {
      return;
    }

    locationControl.markAsTouched();
    locationControl.setErrors({
      ...(locationControl.errors || {}),
      invalidLocationSelection: true
    });
  }

  private clearLocationSelectionError(): void {
    const locationControl = this.leaderApplicationForm.get('location');
    if (!locationControl || !locationControl.errors?.['invalidLocationSelection']) {
      return;
    }

    const nextErrors = { ...(locationControl.errors || {}) };
    delete nextErrors['invalidLocationSelection'];
    locationControl.setErrors(Object.keys(nextErrors).length ? nextErrors : null);
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
