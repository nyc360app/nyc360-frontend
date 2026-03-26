import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  CATEGORY_THEMES,
  CategoryEnum,
  DEPARTMENT_PATHS,
  getDepartmentHomeRoute,
  normalizeDepartmentPath
} from '../../../Widgets/feeds/models/categories';
import { PostsService } from '../../posts/services/posts';
import {
  SPACE_LISTING_ENTITY_ENUM,
  SpaceListingEntityType,
  SpaceListingService,
  SpaceListingSubmitResult
} from '../../../../../shared/services/space-listing.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AuthService } from '../../../../Authentication/Service/auth';
import { BadgeOption } from '../../../../../shared/utils/community-badge-policy';
import {
  getCommunityErrorMessage,
  hasCommunityOrganizationAccess,
  hasCommunityStaffBypass,
  isCommunityGate1Eligible
} from '../../../../../shared/utils/community-contract';
import { CommunityService } from '../../communities/services/community';
import { CommunityLeaderApplicationModalComponent } from '../../../../../shared/components/community-leader-application-modal/community-leader-application-modal';

type LocationSearchResult = {
  id: number;
  borough?: string;
  neighborhood?: string;
  neighborhoodNet?: string;
  zipCode?: string;
};

@Component({
  selector: 'app-space-listing-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CommunityLeaderApplicationModalComponent],
  templateUrl: './space-listing-request.html',
  styleUrls: ['./space-listing-request.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpaceListingRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly spaceListingService = inject(SpaceListingService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly communityService = inject(CommunityService);

  private readonly locationSearch$ = new Subject<string>();

  protected readonly entityTypes: Array<{ value: SpaceListingEntityType; label: string; description: string }> = [
    { value: 'organization', label: 'Organization', description: 'Community groups, nonprofits, networks, and formal organizations.' },
    { value: 'business', label: 'Business', description: 'Businesses, storefronts, services, and commercial entities.' },
    { value: 'place', label: 'Place', description: 'Named places, venues, landmarks, and public spaces.' },
    { value: 'location', label: 'Location', description: 'A neighborhood-level or area-based location reference.' }
  ];

  form = this.fb.group({
    entityType: ['organization' as SpaceListingEntityType, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    locationSearch: [''],
    locationId: [null as number | null],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(?:-\d{4})?$/)]],
    street: ['', Validators.maxLength(120)],
    buildingNumber: ['', Validators.maxLength(40)],
    website: ['', [this.urlValidator]],
    phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-().]{7,20}$/)]],
    publicEmail: ['', Validators.email],
    contactName: ['', Validators.maxLength(100)],
    submitterNote: ['', Validators.maxLength(1000)],
    isClaimingOwnership: [false]
  }, {
    validators: [this.contactMethodValidator]
  });

  departmentPath = 'news';
  departmentTheme = CATEGORY_THEMES[7];
  locationResults: LocationSearchResult[] = [];
  selectedLocation: LocationSearchResult | null = null;
  showLocationDropdown = false;
  isSubmitting = false;
  submissionResult: SpaceListingSubmitResult | null = null;
  imageFiles: File[] = [];
  documentFiles: File[] = [];
  ownershipFiles: File[] = [];
  proofFiles: File[] = [];
  currentUserInfo: any | null = this.authService.getFullUserInfo();
  communityAccessOptions: BadgeOption[] = [];
  isVerificationModalOpen = false;
  preferredOccupationId: number | null = null;

  ngOnInit(): void {
    this.resolveDepartment();

    const initialEntityType = this.route.snapshot.queryParamMap.get('entityType');
    if (this.isEntityType(initialEntityType)) {
      this.form.patchValue({ entityType: initialEntityType });
    }

    if (this.isCommunityDepartment) {
      this.form.patchValue({ entityType: 'organization' }, { emitEvent: false });
    }

    this.authService.fullUserInfo$.subscribe((info) => {
      this.currentUserInfo = info;
      this.cdr.markForCheck();
    });

    if (this.authService.isLoggedIn() && !this.authService.getFullUserInfo()) {
      this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
    }

    if (this.isCommunityDepartment) {
      this.communityService.getCommunityBadgeOptions().subscribe({
        next: (options) => {
          this.communityAccessOptions = options;
          this.cdr.markForCheck();
        },
        error: () => {
          this.communityAccessOptions = [];
          this.cdr.markForCheck();
        }
      });
    }

    this.form.get('entityType')?.valueChanges.subscribe(() => {
      if (this.isCommunityDepartment) {
        this.form.patchValue({ entityType: 'organization' }, { emitEvent: false });
      }
      this.form.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });

    this.locationSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (!term || term.trim().length < 2) {
          return of([]);
        }

        return this.postsService.searchLocations(term.trim(), 8).pipe(
          catchError(() => of({ data: [] }))
        );
      })
    ).subscribe((response: any) => {
      this.locationResults = response?.data || [];
      this.showLocationDropdown = this.locationResults.length > 0;
      this.cdr.markForCheck();
    });
  }

  get pageTitle(): string {
    if (this.isCommunityDepartment) {
      return 'List a Community Organization';
    }
    return `Add a ${this.departmentTheme?.label || 'Department'} Listing`;
  }

  get pageDescription(): string {
    if (this.isCommunityDepartment) {
      return 'Submit a verified community organization listing for review and publication into THE360 Space.';
    }
    return `Submit a location, place, business, or organization for ${this.departmentTheme?.label || 'NYC360'} and send it to THE360 Space for review.`;
  }

  get selectedEntityType(): SpaceListingEntityType {
    return (this.form.get('entityType')?.value as SpaceListingEntityType) || 'organization';
  }

  get selectedEntityMeta() {
    const available = this.availableEntityTypes;
    return available.find((item) => item.value === this.selectedEntityType) || available[0];
  }

  get requiresContactMethod(): boolean {
    return this.selectedEntityType !== 'location';
  }

  get showContactMethodError(): boolean {
    return !!(this.form.errors?.['contactMethodRequired'] && (this.form.touched || this.form.dirty));
  }

  get departmentHomeRoute(): string {
    return getDepartmentHomeRoute(this.departmentPath);
  }

  get isCommunityDepartment(): boolean {
    return this.departmentPath === 'community';
  }

  get availableEntityTypes(): Array<{ value: SpaceListingEntityType; label: string; description: string }> {
    if (this.isCommunityDepartment) {
      return this.entityTypes.filter((option) => option.value === 'organization');
    }

    return this.entityTypes;
  }

  get hasGate1Eligibility(): boolean {
    return this.hasStaffBypass || isCommunityGate1Eligible(this.currentUserInfo);
  }

  get hasStaffBypass(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('SuperAdmin')
      || hasCommunityStaffBypass(this.currentUserInfo);
  }

  get hasCommunityOrganizationAccess(): boolean {
    return this.hasStaffBypass || hasCommunityOrganizationAccess(this.currentUserInfo?.tags || []);
  }

  get showCommunityOrganizationLock(): boolean {
    return this.isCommunityDepartment && (!this.hasGate1Eligibility || !this.hasCommunityOrganizationAccess);
  }

  get verificationModalOccupations(): BadgeOption[] {
    return this.communityAccessOptions.filter((option) => hasCommunityOrganizationAccess([option]));
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

  onLocationInput(value: string): void {
    this.locationSearch$.next(value);

    if (!value.trim()) {
      this.clearSelectedLocation(false);
    }
  }

  selectLocation(location: LocationSearchResult): void {
    this.selectedLocation = location;
    this.showLocationDropdown = false;
    this.form.patchValue({
      locationSearch: this.formatLocationLabel(location),
      locationId: location.id,
      zipCode: location.zipCode || this.form.get('zipCode')?.value || ''
    });
    this.form.get('locationId')?.markAsDirty();
    this.cdr.markForCheck();
  }

  clearSelectedLocation(markForCheck: boolean = true): void {
    this.selectedLocation = null;
    this.locationResults = [];
    this.showLocationDropdown = false;
    this.form.patchValue({
      locationId: null
    });
    if (markForCheck) {
      this.cdr.markForCheck();
    }
  }

  submit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.showCommunityOrganizationLock) {
      this.toastService.error('Community organization listing access is locked for this account.');
      return;
    }

    if (!this.selectedLocation && this.form.get('locationId')?.value) {
      this.form.patchValue({ locationSearch: '' });
    }

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid || !this.hasValidLocationRule()) {
      this.toastService.error('Please complete the required listing details before submitting.');
      this.cdr.markForCheck();
      return;
    }

    const value = this.form.getRawValue();
    this.isSubmitting = true;
    this.cdr.markForCheck();

    if (value.isClaimingOwnership && this.ownershipFiles.length === 0) {
      this.toastService.error('Ownership documents are required when claiming ownership.');
      this.isSubmitting = false;
      this.cdr.markForCheck();
      return;
    }

    const departmentEnum = this.getDepartmentEnum(this.departmentPath);
    const entityEnum = SPACE_LISTING_ENTITY_ENUM[value.entityType as SpaceListingEntityType];

    try {
    const locationFallback = this.getLocationFallback(value.locationSearch);

    this.spaceListingService.submitListing({
      department: departmentEnum,
      entityType: entityEnum,
      name: (value.name || '').trim(),
      description: (value.description || '').trim(),
      address: {
        addressId: null,
        locationId: value.locationId,
        street: this.optionalString(value.street),
        buildingNumber: this.optionalString(value.buildingNumber),
        zipCode: String(value.zipCode ?? '').trim()
      },
      locationName: locationFallback.locationName,
      borough: locationFallback.borough,
      neighborhood: locationFallback.neighborhood,
      website: this.optionalString(value.website),
      phoneNumber: this.optionalString(value.phoneNumber),
      publicEmail: this.optionalString(value.publicEmail),
      contactName: this.optionalString(value.contactName),
      submitterNote: this.optionalString(value.submitterNote),
      isClaimingOwnership: !!value.isClaimingOwnership,
        images: this.imageFiles,
        documents: this.documentFiles,
        ownershipDocuments: this.ownershipFiles,
        proofDocuments: this.proofFiles
      }).subscribe({
        next: (response) => {
          this.isSubmitting = false;

          if (response?.isSuccess && response.data) {
            this.submissionResult = response.data;
            this.toastService.success('Listing request submitted for review.');
            this.cdr.markForCheck();
            return;
          }

          this.toastService.error(getCommunityErrorMessage(response, 'Unable to submit the listing request right now.'));
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.error(getCommunityErrorMessage(error, 'Unable to submit the listing request right now.'));
          this.cdr.markForCheck();
        }
      });
    } catch (error: any) {
      this.isSubmitting = false;
      this.toastService.error(getCommunityErrorMessage(error, 'Unable to submit the listing request right now.'));
      this.cdr.markForCheck();
    }
  }

  onFilesSelected(event: Event, target: 'images' | 'documents' | 'ownership' | 'proof'): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (target === 'images') this.imageFiles = files;
    if (target === 'documents') this.documentFiles = files;
    if (target === 'ownership') this.ownershipFiles = files;
    if (target === 'proof') this.proofFiles = files;

    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  closeLocationDropdown(): void {
    this.showLocationDropdown = false;
  }

  private resolveDepartment(): void {
    const candidate = this.route.snapshot.data['categoryPath']
      || this.route.snapshot.params['categoryPath']
      || this.route.snapshot.url[0]?.path
      || 'news';

    const normalized = normalizeDepartmentPath(candidate);

    this.departmentPath = DEPARTMENT_PATHS.includes(normalized as any) ? normalized : 'news';

    const match = Object.values(CATEGORY_THEMES).find((theme: any) => theme.path === this.departmentPath);
    this.departmentTheme = match || CATEGORY_THEMES[7];
  }

  openCommunityOrganizationAccess(): void {
    if (!this.hasGate1Eligibility) {
      this.toastService.info('A verified Resident, Organization, or Business account is required before requesting the D01.3 Community Organization tag.');
      this.router.navigate(['/public/profile/settings']);
      return;
    }

    if (!this.verificationModalOccupations.length) {
      this.toastService.error('Community contributor roles are not available right now.');
      return;
    }

    this.preferredOccupationId = this.verificationModalOccupations[0]?.id ?? null;
    this.isVerificationModalOpen = true;
    this.cdr.markForCheck();
  }

  closeVerificationModal(): void {
    this.preferredOccupationId = null;
    this.isVerificationModalOpen = false;
    this.cdr.markForCheck();
  }

  onVerified(): void {
    this.authService.fetchFullUserInfo().subscribe({ error: () => undefined });
    this.closeVerificationModal();
  }

  private contactMethodValidator(control: AbstractControl): ValidationErrors | null {
    const entityType = control.get('entityType')?.value as SpaceListingEntityType | null;
    if (!entityType || entityType === 'location') {
      return null;
    }

    const hasContactMethod = ['website', 'phoneNumber', 'publicEmail'].some((field) => {
      const value = control.get(field)?.value;
      return typeof value === 'string' && value.trim().length > 0;
    });

    return hasContactMethod ? null : { contactMethodRequired: true };
  }

  private urlValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim();
    if (!value) return null;
    const normalized = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
    try {
      new URL(normalized);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  private formatLocationLabel(location: LocationSearchResult): string {
    return location.neighborhoodNet
      || [location.neighborhood, location.borough].filter(Boolean).join(', ')
      || `Location #${location.id}`;
  }

  private optionalString(value: string | null | undefined): string | null {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : null;
  }

  private isEntityType(value: string | null): value is SpaceListingEntityType {
    return value === 'location' || value === 'place' || value === 'business' || value === 'organization';
  }

  private getLocationFallback(rawValue: string | null | undefined): { locationName?: string | null; borough?: string | null; neighborhood?: string | null } {
    if (this.form.get('locationId')?.value) {
      return {};
    }

    const trimmed = String(rawValue || '').trim();
    if (!trimmed) return {};

    const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
    const neighborhood = parts[0] || null;
    const borough = parts[1] || null;

    return {
      locationName: trimmed,
      borough,
      neighborhood
    };
  }

  private hasValidLocationRule(): boolean {
    if (this.form.get('locationId')?.value) {
      return true;
    }

    const fallback = this.getLocationFallback(this.form.get('locationSearch')?.value);
    return !!(fallback.locationName || fallback.borough || fallback.neighborhood);
  }

  private getDepartmentEnum(path: string): number {
    const normalized = normalizeDepartmentPath(path);
    const map: Record<string, number> = {
      community: CategoryEnum.Community,
      culture: CategoryEnum.Culture,
      education: CategoryEnum.Education,
      health: CategoryEnum.Health,
      housing: CategoryEnum.Housing,
      lifestyle: CategoryEnum.Lifestyle,
      legal: CategoryEnum.Legal,
      news: CategoryEnum.News,
      professions: CategoryEnum.Professions,
      social: CategoryEnum.Social,
      transportation: CategoryEnum.Transportation,
      tv: CategoryEnum.Tv
    };

    return map[normalized] ?? CategoryEnum.News;
  }
}
