import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateCommunityService } from '../../services/createcommunty';
import {
  COMMUNITY_CATEGORY_OPTIONS,
  COMMUNITY_DIVISION_TAG_OPTIONS,
  CommunityCategoryOption,
  CommunityTypeOption,
  LocationSearchResult,
} from '../../models/createcommunty';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { BadgeOption } from '../../../../../../shared/utils/community-badge-policy';
import {
  getCommunityErrorMessage,
  hasCommunityCreateAccess,
  hasCommunityLeaderAccess,
  hasCommunityStaffBypass,
  isCommunityGate1Eligible
} from '../../../../../../shared/utils/community-contract';
import { CommunityService } from '../../services/community';

@Component({
  selector: 'app-create-community',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CommunityDepartmentHeroComponent],
  templateUrl: './create-community.html',
  styleUrls: ['./create-community.scss']
})
export class CreateCommunityComponent implements OnInit {
  private readonly defaultCategory = COMMUNITY_CATEGORY_OPTIONS[0];
  private readonly defaultDivisionTag = COMMUNITY_DIVISION_TAG_OPTIONS[0];

  private fb = inject(FormBuilder);
  private communityService = inject(CreateCommunityService);
  private communityAccessService = inject(CommunityService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Data
  categoryOptions = COMMUNITY_CATEGORY_OPTIONS;
  isSubmitting = false;
  errorSummary: string | null = null;

  // Files
  avatarFile: File | null = null;
  coverFile: File | null = null;
  avatarPreview: string | null = null;
  coverPreview: string | null = null;

  divisionTagOptions = COMMUNITY_DIVISION_TAG_OPTIONS;
  locationResults: LocationSearchResult[] = [];
  isSearchingLocations = false;
  currentUserInfo: any | null = this.authService.getFullUserInfo();
  accessOptions: BadgeOption[] = [];
  isVerificationModalOpen = false;
  isAccessLoading = true;
  preferredOccupationId: number | null = null;

  // Form
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.pattern('^[a-z0-9-]+$')]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    categoryCode: [this.defaultCategory.code, Validators.required],
    type: [this.defaultCategory.types[0]?.id ?? null, Validators.required],
    divisionTag: [this.defaultDivisionTag.id, Validators.required],
    borough: ['', Validators.required],
    neighborhood: ['', Validators.required],
    zipCode: [''],
    locationId: [null],
    isPrivate: [false]
  });

  get inviteLink(): string {
    const slug = (this.form.get('slug')?.value || '').trim();
    return slug ? `nyc360.com/join/${slug}` : 'nyc360.com/join/your-community';
  }

  get isStaff(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('SuperAdmin')
      || hasCommunityStaffBypass(this.currentUserInfo);
  }

  get hasGate1Eligibility(): boolean {
    return this.isStaff || isCommunityGate1Eligible(this.currentUserInfo);
  }

  get hasCreateGateAccess(): boolean {
    return this.isStaff || hasCommunityCreateAccess(this.currentUserInfo?.tags || []);
  }

  get canSubmitCommunity(): boolean {
    return this.hasGate1Eligibility && this.hasCreateGateAccess;
  }

  get showLockedState(): boolean {
    return !this.isAccessLoading && !this.canSubmitCommunity;
  }

  get verificationModalOccupations(): BadgeOption[] {
    return this.accessOptions.filter((option) => hasCommunityLeaderAccess([option]));
  }

  get contributorApplicationFullName(): string {
    const firstName = String(this.currentUserInfo?.firstName || '').trim();
    const lastName = String(this.currentUserInfo?.lastName || '').trim();
    return `${firstName} ${lastName}`.trim();
  }

  get contributorApplicationEmail(): string {
    return String(this.currentUserInfo?.email || '').trim();
  }

  get contributorApplicationPhoneNumber(): string {
    return String(this.currentUserInfo?.phoneNumber || '').trim();
  }

  get selectedCategory(): CommunityCategoryOption {
    const categoryCode = this.form.get('categoryCode')?.value;
    return this.categoryOptions.find((category) => category.code === categoryCode) || this.defaultCategory;
  }

  get typesList(): CommunityTypeOption[] {
    return this.selectedCategory?.types || [];
  }

  searchNeighborhoods(query: string) {
    this.form.patchValue({ neighborhood: '', borough: '', zipCode: '', locationId: null });
    if (query.length < 2) {
      this.locationResults = [];
      return;
    }
    this.isSearchingLocations = true;
    this.communityService.searchLocations(query).subscribe({
      next: (res) => {
        this.locationResults = res.isSuccess ? res.data : [];
        this.isSearchingLocations = false;
      },
      error: () => {
        this.locationResults = [];
        this.isSearchingLocations = false;
      }
    });
  }

  selectNeighborhoodResult(loc: LocationSearchResult, inputEl: HTMLInputElement) {
    this.form.patchValue({
      neighborhood: loc.neighborhood,
      borough: loc.borough,
      zipCode: String(loc.zipCode),
      locationId: loc.id
    });
    inputEl.value = `${loc.neighborhood} (${loc.borough})`;
    this.locationResults = [];
  }

  ngOnInit() {
    this.authService.fullUserInfo$.subscribe((info) => {
      this.currentUserInfo = info;
    });

    if (this.authService.isLoggedIn() && !this.authService.getFullUserInfo()) {
      this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
    }

    this.communityAccessService.getCommunityBadgeOptions().subscribe({
      next: (options) => {
        this.accessOptions = options;
        this.isAccessLoading = false;
      },
      error: () => {
        this.accessOptions = [];
        this.isAccessLoading = false;
      }
    });
  }

  // --- Actions ---

  openCreateAccessModal(): void {
    if (!this.hasGate1Eligibility) {
      this.toastService.info('A verified Resident, Organization, or Business account is required before requesting Community contributor access.');
      this.router.navigate(['/public/profile/settings']);
      return;
    }

    if (!this.verificationModalOccupations.length) {
      this.toastService.error('Community contributor roles are not available right now.');
      return;
    }

    this.preferredOccupationId = this.verificationModalOccupations[0]?.id ?? null;
    this.isVerificationModalOpen = true;
  }

  closeVerificationModal(): void {
    this.preferredOccupationId = null;
    this.isVerificationModalOpen = false;
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
    this.closeVerificationModal();
  }

  // Auto-generate slug
  onNameChange() {
    const name = this.form.get('name')?.value;
    if (name) {
      // Improved slug: lowercase, trim, replace spaces with hyphens, remove all non-alphanumeric (except hyphens)
      const slug = name.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      this.form.get('slug')?.setValue(slug);
    }
  }

  onCategorySelect(categoryCode: string) {
    const selectedCategory = this.categoryOptions.find((category) => category.code === categoryCode);
    if (!selectedCategory) {
      return;
    }

    this.form.patchValue({
      categoryCode: selectedCategory.code,
      type: selectedCategory.types[0]?.id ?? null
    });
  }

  onTypeSelect(typeId: number) {
    this.form.get('type')?.setValue(typeId);
  }

  onDivisionTagSelect(tagId: string) {
    this.form.get('divisionTag')?.setValue(tagId);
  }


  // File Handlers
  onAvatarSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  onCoverSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverFile = file;
      const reader = new FileReader();
      reader.onload = e => this.coverPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  copyInviteLink() {
    const link = this.inviteLink;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => this.toastService.success('Invite link copied.'))
        .catch(() => this.toastService.error('Could not copy invite link.'));
      return;
    }
    this.toastService.error('Clipboard is not available in this browser.');
  }

  submit() {
    if (this.form.invalid) {
      this.errorSummary = 'Please fix the errors highlighted above.';
      this.form.markAllAsTouched();
      this.toastService.error('Please fix the errors in the form before submitting.');
      return;
    }

    this.errorSummary = null;
    this.isSubmitting = true;

    const formData = this.form.value;

    this.communityService.createCommunity(formData, this.avatarFile || undefined, this.coverFile || undefined)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.isSuccess) {
            this.toastService.success('Community created successfully!');
            this.router.navigate(['/communities', res.data]);
          } else {
            this.toastService.error(getCommunityErrorMessage(res, 'Unable to create the community.'));
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastService.error(getCommunityErrorMessage(err, 'Failed to connect to the server.'));
        }
      });
  }
}
