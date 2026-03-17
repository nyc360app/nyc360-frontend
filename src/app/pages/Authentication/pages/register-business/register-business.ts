import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { RegistrationService } from '../../Service/registration-service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CATEGORY_THEMES } from '../../../Public/Widgets/feeds/models/categories';
import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';
import { SocialPlatform } from '../../../Public/pages/profile/models/profile';
import { JobSearchService } from '../../../Public/pages/jobs/service/job-search';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Enums as requested
export enum BusinessSize {
    Freelancer = 0,
    SmallBusiness = 1,
    MediumBusiness = 2,
    Enterprise = 3
}

export enum Industry {
    None = 0,
    Technology = 1,
    Finance = 2,
    Healthcare = 3,
    Education = 4,
    Retail = 5,
    Hospitality = 6,
    Food = 7,
    Media = 8,
    RealEstate = 9,
    Construction = 10,
    Transportation = 11,
    Manufacturing = 12,
    Fashion = 13,
    Legal = 14,
    Marketing = 15,
    Sports = 16,
    Energy = 17,
    Telecommunications = 18,
    Automotive = 19,
    Aerospace = 20,
    Agriculture = 21,
    Other = 99
}

export enum Services {
    Consulting = 0,
    SoftwareDevelopment = 1,
    ItSupport = 2,
    Marketing = 3,
    Design = 4,
    Hr = 5,
    CustomerSupport = 6,
    Sales = 7,
    Operations = 8,
    Manufacturing = 9,
    Installation = 10,
    Finance = 11,
    Training = 12,
    EventServices = 13
}

export enum ServiceArea {
    Citywide = 0,
    BoroughSpecific = 1,
    NeighborhoodSpecific = 2,
    Online = 3
}

export enum OwnershipType {
    Minority = 0,
    Woman = 1,
    Veteran = 2,
    Other = 3
}

@Component({
    selector: 'app-register-business',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AuthSuccessModalComponent],
    templateUrl: './register-business.html',
    styleUrls: ['./register-business.scss']
})
export class RegisterBusinessComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private registrationService = inject(RegistrationService);
    private toastService = inject(ToastService);
    private jobSearchService = inject(JobSearchService);

    form!: FormGroup;
    isLoading = false;
    submitted = false;

    // Data Lists
    interestsList = Object.keys(CATEGORY_THEMES).map(key => {
        const id = Number(key);
        const theme = CATEGORY_THEMES[id];
        return {
            id: id,
            name: theme.label,
            icon: theme.biIcon,
            color: theme.color
        };
    });
    selectedInterestIds: number[] = [];

    // Enum Options
    businessSizes = [
        { value: BusinessSize.Freelancer, label: 'Freelancer' },
        { value: BusinessSize.SmallBusiness, label: 'Small Business' },
        { value: BusinessSize.MediumBusiness, label: 'Medium Business' },
        { value: BusinessSize.Enterprise, label: 'Enterprise' }
    ];

    industries = [
        { value: Industry.Technology, label: 'Technology' },
        { value: Industry.Finance, label: 'Finance' },
        { value: Industry.Healthcare, label: 'Healthcare' },
        { value: Industry.Education, label: 'Education' },
        { value: Industry.Retail, label: 'Retail' },
        { value: Industry.Hospitality, label: 'Hospitality' },
        { value: Industry.Food, label: 'Food & Beverage' },
        { value: Industry.Media, label: 'Media' },
        { value: Industry.RealEstate, label: 'Real Estate' },
        { value: Industry.Construction, label: 'Construction' },
        { value: Industry.Transportation, label: 'Transportation' },
        { value: Industry.Other, label: 'Other' }
    ];

    servicesOptions = [
        { value: Services.Consulting, label: 'Consulting' },
        { value: Services.SoftwareDevelopment, label: 'Software Development' },
        { value: Services.Marketing, label: 'Marketing' },
        { value: Services.Design, label: 'Design' },
        { value: Services.Finance, label: 'Finance' },
        { value: Services.EventServices, label: 'Event Services' }
    ];

    serviceAreas = [
        { value: ServiceArea.Citywide, label: 'Citywide' },
        { value: ServiceArea.BoroughSpecific, label: 'Borough Specific' },
        { value: ServiceArea.NeighborhoodSpecific, label: 'Neighborhood Specific' },
        { value: ServiceArea.Online, label: 'Online' }
    ];

    ownershipTypes = [
        { value: OwnershipType.Minority, label: 'Minority-Owned' },
        { value: OwnershipType.Woman, label: 'Woman-Owned' },
        { value: OwnershipType.Veteran, label: 'Veteran-Owned' },
        { value: OwnershipType.Other, label: 'Other' }
    ];

    socialPlatforms = [
        { value: SocialPlatform.Facebook, label: 'Facebook', icon: 'bi-facebook', color: '#1877F2' },
        { value: SocialPlatform.Twitter, label: 'Twitter', icon: 'bi-twitter-x', color: '#000000' },
        { value: SocialPlatform.Instagram, label: 'Instagram', icon: 'bi-instagram', color: '#E4405F' },
        { value: SocialPlatform.LinkedIn, label: 'LinkedIn', icon: 'bi-linkedin', color: '#0A66C2' },
        { value: SocialPlatform.Youtube, label: 'YouTube', icon: 'bi-youtube', color: '#FF0000' },
        { value: SocialPlatform.Github, label: 'GitHub', icon: 'bi-github', color: '#181717' },
        { value: SocialPlatform.Website, label: 'Website', icon: 'bi-globe', color: '#26A69A' },
        { value: SocialPlatform.Other, label: 'Other', icon: 'bi-link-45deg', color: '#64748b' }
    ];

    // Location Search
    locations: any[] = [];
    isSearchingLocations = false;

    // Modal State
    showModal = false;
    modalTitle = 'Welcome to NYC360 Business!';
    modalMessage = '';

    ngOnInit() {
        this.initForm();
        this.setupLocationSearch();
    }

    initForm() {
        this.form = this.fb.group({
            Name: ['', [Validators.required, Validators.minLength(2)]],
            Username: ['', [Validators.required, Validators.minLength(4)]],
            Email: ['', [Validators.required, Validators.email]],
            Password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*\d).{6,}$/)]],
            Industry: [null, Validators.required],
            BusinessSize: [null, Validators.required],
            ServiceArea: [0, Validators.required], // Default to Citywide
            Services: [0, Validators.required],   // Default to first service
            Address: this.fb.group({
                AddressId: [0], // Backend expects AddressId (0 for new)
                LocationId: [null, Validators.required],
                Street: ['', Validators.required],
                BuildingNumber: ['', Validators.required],
                ZipCode: ['', Validators.required]
            }),
            MakeProfilePublic: [true],
            Website: ['', [Validators.pattern(/https?:\/\/.+/)]],
            PhoneNumber: ['', [Validators.pattern(/^\+?[0-9\s-]{10,15}$/)]],
            Description: ['', [Validators.maxLength(500)]],
            SocialLinks: this.fb.array([]),
            IsLicensedInNyc: [false],
            IsInsured: [false],
            OwnershipType: [null, Validators.required]
        });
    }

    get socialLinks() {
        return this.form.get('SocialLinks') as FormArray;
    }

    addSocialLink() {
        this.socialLinks.push(this.fb.group({
            Platform: [null, Validators.required],
            Url: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]]
        }));
        this.toastService.info('Social link field added.');
    }

    removeSocialLink(index: number) {
        this.socialLinks.removeAt(index);
        this.toastService.info('Social link removed.');
    }

    setupLocationSearch() {
        const addressGroup = this.form.get('Address') as FormGroup;
        // We can't easily debounce on a single input inside a group without a separate control or using valueChanges on the whole group
        // But for registration, we might just use a simple lookup or search input
    }

    searchLocations(query: string) {
        if (query.length < 2) {
            this.locations = [];
            return;
        }
        this.isSearchingLocations = true;
        this.jobSearchService.searchLocations(query).subscribe({
            next: (res) => {
                this.locations = res.data;
                this.isSearchingLocations = false;
            },
            error: () => this.isSearchingLocations = false
        });
    }

    selectLocation(loc: any, inputElement?: HTMLInputElement) {
        const addressGroup = this.form.get('Address');
        addressGroup?.patchValue({
            LocationId: loc.id,
            ZipCode: loc.zipCode ? String(loc.zipCode) : ''
        });

        // Update the input field to show the selected location
        if (inputElement) {
            inputElement.value = `${loc.neighborhood} (${loc.borough})`;
        }

        this.locations = []; // clear results
        this.toastService.success(`Neighborhood set to: ${loc.neighborhood}`);
    }


    toggleInterest(id: number) {
        const index = this.selectedInterestIds.indexOf(id);
        const category = this.interestsList.find(c => c.id === id);
        if (index >= 0) {
            this.selectedInterestIds.splice(index, 1);
            this.toastService.info(`Removed interest: ${category?.name}`);
        } else {
            this.selectedInterestIds.push(id);
            this.toastService.success(`Added interest: ${category?.name}`);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedInterestIds.includes(id);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
    }

    isAddressFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(`Address.${fieldName}`);
        return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
    }

    onSubmit() {
        this.submitted = true;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.scrollToFirstInvalidControl();
            this.toastService.warning('Please complete all required fields.');
            return;
        }

        if (this.selectedInterestIds.length === 0) {
            this.toastService.warning('Please select at least one "Business Interest" focus area.');
            const interestsEl = document.querySelector('.chips-grid');
            interestsEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const payload = {
            ...formValue,
            Interests: this.selectedInterestIds
        };

        // Ensure ZipCode is a string
        if (payload.Address && payload.Address.ZipCode) {
            payload.Address.ZipCode = String(payload.Address.ZipCode);
        }

        this.registrationService.registerBusiness(payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess) {
                    this.modalTitle = 'Account Created!';
                    this.modalMessage = 'Your business registration was successful. Welcome to the NYC360 network!';
                    this.showModal = true;
                } else {
                    this.toastService.error(res.error?.message || 'Registration failed.');
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.toastService.error('An error occurred. Please try again.');
            }
        });
    }

    onModalClose() {
        this.showModal = false;
        this.router.navigate(['/auth/login']);
    }

    goBack() {
        this.router.navigate(['/auth/register']);
    }

    private scrollToFirstInvalidControl() {
        const firstInvalidControl: HTMLElement = document.querySelector(
            'input.ng-invalid:not(form), select.ng-invalid:not(form), textarea.ng-invalid:not(form), .is-invalid'
        ) as HTMLElement;

        if (firstInvalidControl) {
            firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidControl.classList.add('highlight-error');
            setTimeout(() => {
                firstInvalidControl.classList.remove('highlight-error');
                firstInvalidControl.focus();
            }, 600);
        }
    }
}
