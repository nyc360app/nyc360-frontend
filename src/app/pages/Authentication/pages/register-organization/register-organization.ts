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

export enum OrganizationType {
    Nonprofit = 0,
    CommunityBased = 1,
    CulturalInstitution = 2,
    Educational = 3,
    FaithBased = 4,
    Advocacy = 5,
    Public = 6,
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

export enum FundType {
    Public = 0,
    Private = 1,
    Grants = 2,
    Donations = 3,
    Mixed = 4
}

@Component({
    selector: 'app-register-organization',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,  AuthSuccessModalComponent],
    templateUrl: './register-organization.html',
    styleUrls: ['./register-organization.scss']
})
export class RegisterOrganizationComponent implements OnInit {
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
            icon: theme.biIcon, // biIcon is preferred for these templates
            color: theme.color
        };
    });

    selectedInterestIds: number[] = [];
    selectedServiceIds: number[] = [];

    // Enum Options
    orgTypes = [
        { value: OrganizationType.Nonprofit, label: 'Non-profit' },
        { value: OrganizationType.CommunityBased, label: 'Community Based' },
        { value: OrganizationType.CulturalInstitution, label: 'Cultural Institution' },
        { value: OrganizationType.Educational, label: 'Educational' },
        { value: OrganizationType.FaithBased, label: 'Faith Based' },
        { value: OrganizationType.Advocacy, label: 'Advocacy' },
        { value: OrganizationType.Public, label: 'Public' },
        { value: OrganizationType.Other, label: 'Other' }
    ];

    servicesOptions = [
        { value: Services.Consulting, label: 'Consulting' },
        { value: Services.SoftwareDevelopment, label: 'Software Development' },
        { value: Services.Marketing, label: 'Marketing' },
        { value: Services.Design, label: 'Design' },
        { value: Services.Hr, label: 'HR' },
        { value: Services.EventServices, label: 'Event Services' },
        { value: Services.Training, label: 'Training' }
    ];

    serviceAreas = [
        { value: ServiceArea.Citywide, label: 'Citywide' },
        { value: ServiceArea.BoroughSpecific, label: 'Borough Specific' },
        { value: ServiceArea.NeighborhoodSpecific, label: 'Neighborhood Specific' },
        { value: ServiceArea.Online, label: 'Online' }
    ];

    fundTypes = [
        { value: FundType.Public, label: 'Public Funding' },
        { value: FundType.Private, label: 'Private Funding' },
        { value: FundType.Grants, label: 'Grants' },
        { value: FundType.Donations, label: 'Donations' },
        { value: FundType.Mixed, label: 'Mixed' }
    ];

    socialPlatforms = [
        { value: SocialPlatform.Facebook, label: 'Facebook', icon: 'bi-facebook', color: '#1877F2' },
        { value: SocialPlatform.Twitter, label: 'Twitter', icon: 'bi-twitter-x', color: '#000000' },
        { value: SocialPlatform.Instagram, label: 'Instagram', icon: 'bi-instagram', color: '#E4405F' },
        { value: SocialPlatform.LinkedIn, label: 'LinkedIn', icon: 'bi-linkedin', color: '#0A66C2' },
        { value: SocialPlatform.Youtube, label: 'YouTube', icon: 'bi-youtube', color: '#FF0000' },
        { value: SocialPlatform.Github, label: 'GitHub', icon: 'bi-github', color: '#181717' },
        { value: SocialPlatform.Website, label: 'Website', icon: 'bi-globe', color: '#6366f1' },
        { value: SocialPlatform.Other, label: 'Other', icon: 'bi-link-45deg', color: '#475569' }
    ];

    // Location Search
    locations: any[] = [];
    isSearchingLocations = false;

    // Modal State
    showModal = false;
    modalTitle = 'Organization Registered!';
    modalMessage = '';

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.form = this.fb.group({
            Name: ['', [Validators.required, Validators.minLength(2)]],
            Username: ['', [Validators.required, Validators.minLength(4)]],
            Email: ['', [Validators.required, Validators.email]],
            Password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*\d).{6,}$/)]],
            OrganizationType: [null, Validators.required],
            ServiceArea: [0, Validators.required], // Default Citywide
            Website: ['', [Validators.pattern(/https?:\/\/.+/)]],
            PhoneNumber: ['', [Validators.pattern(/^\+?[0-9\s-]{10,15}$/)]],
            PublicEmail: ['', [Validators.email]],
            Description: ['', [Validators.maxLength(1000)]],
            FundType: [null, Validators.required],
            IsTaxExempt: [true],
            IsNysRegistered: [true],
            Address: this.fb.group({
                AddressId: [0], // Local default
                Street: ['', Validators.required],
                BuildingNumber: ['', Validators.required],
                ZipCode: ['', Validators.required],
                LocationId: [null, Validators.required]
            }),
            SocialLinks: this.fb.array([])
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

        this.locations = [];
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

    toggleService(id: number) {
        const index = this.selectedServiceIds.indexOf(id);
        const service = this.servicesOptions.find(s => s.value === id);
        if (index >= 0) {
            this.selectedServiceIds.splice(index, 1);
            this.toastService.info(`Service removed: ${service?.label}`);
        } else {
            this.selectedServiceIds.push(id);
            this.toastService.success(`Service added: ${service?.label}`);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedInterestIds.includes(id);
    }

    isServiceSelected(id: number): boolean {
        return this.selectedServiceIds.includes(id);
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

        if (this.selectedServiceIds.length === 0) {
            this.toastService.warning('Please select at least one "Service Provided" from the chips.');
            const servicesEl = document.querySelector('.chips-grid');
            servicesEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (this.selectedInterestIds.length === 0) {
            this.toastService.warning('Please select at least one "Civic Interest" focus area.');
            const interestsEl = document.querySelectorAll('.chips-grid')[1];
            interestsEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const payload = {
            ...formValue,
            Interests: this.selectedInterestIds,
            Services: this.selectedServiceIds
        };

        // Ensure ZipCode is a string for the backend API
        if (payload.Address && payload.Address.ZipCode) {
            payload.Address.ZipCode = String(payload.Address.ZipCode);
        }

        this.registrationService.registerOrganization(payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess) {
                    this.modalTitle = 'Welcome, Partner!';
                    this.modalMessage = 'Your organization has been registered successfully. We look forward to your civic contributions!';
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
