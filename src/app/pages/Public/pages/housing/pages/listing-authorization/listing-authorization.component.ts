import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HousingAuthService } from '../../service/housing-auth.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { AuthService } from '../../../../../Authentication/Service/auth';

@Component({
    selector: 'app-listing-authorization',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './listing-authorization.html',
    styleUrls: ['./listing-authorization.scss']
})
export class ListingAuthorizationComponent implements OnInit {
    private fb = inject(FormBuilder);
    private housingService = inject(HousingAuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);

    form: FormGroup;
    selectedFiles: File[] = [];
    listingId: number | null = null;
    isSubmitting = false;
    triedToSubmit = false;

    // Options for dropdowns
    authorizationTypes = [
        { id: 0, name: 'Individual Authorization' },
        { id: 1, name: 'Business Authorization' },
        { id: 2, name: 'Organization Authorization' }
    ];

    documentTypes = [
        { id: 0, name: 'Property Deed or Title' },
        { id: 1, name: 'Signed Lease Agreement' },
        { id: 2, name: 'Owner Authorization Letter' },
        { id: 3, name: 'Listing Agreement (Agent or Agency)' },
        { id: 4, name: 'Broker Authorization Form' },
        { id: 5, name: 'Leasing Agreement' },
        { id: 6, name: 'Property Management Agreement' },
        { id: 7, name: 'Government-Issued ID Driver\'s License' },
        { id: 8, name: 'Government-Issued State ID' },
        { id: 9, name: 'Government-Issued Passport' },
        { id: 10, name: 'Real Estate Agent or Brokerage License' },
        { id: 11, name: 'Business Registration Certificate' },
        { id: 12, name: 'Organization Registration Certificate' }
    ];

    availabilityTypes = [
        { id: 1, name: 'Contact' },
        { id: 2, name: 'Virtual Tour' },
        { id: 3, name: 'In-Person Tour' }
    ];

    constructor() {
        this.form = this.fb.group({
            FullName: ['', Validators.required],
            OrganizationName: [''],
            Email: ['', [Validators.required, Validators.email]],
            PhoneNumber: ['', Validators.required],

            Availabilities: this.fb.array([]),

            AuthorizationType: [null, Validators.required],
            ListingAuthorizationDocument: [null, Validators.required],
            AuthorizationValidationDate: [null],
            SaveThisAuthorizationForFutureListings: [true]
        });



    }

    get availabilities(): FormArray {
        return this.form.get('Availabilities') as FormArray;
    }

    // Helper to get form groups by type for the template
    getIndexesByType(typeId: number): number[] {
        return this.availabilities.controls
            .map((control, index) => ({ control, index }))
            .filter(({ control }) => control.get('AvailabilityType')?.value === typeId)
            .map(({ index }) => index);
    }

    createAvailabilityGroup(typeId: number = 1): FormGroup {
        return this.fb.group({
            AvailabilityType: [typeId, Validators.required],
            Dates: [[]], // Array of date strings
            _dateInput: [''],
            TimeFrom: [''],
            TimeTo: ['']
        });
    }

    addAvailability(typeId: number) {
        this.availabilities.push(this.createAvailabilityGroup(typeId));
    }

    removeAvailability(index: number) {
        this.availabilities.removeAt(index);
    }

    // Date Chip Helper Methods
    addDate(groupIndex: number, event: any) {
        const input = event.target;
        const value = input.value;

        if (value) {
            const group = this.availabilities.at(groupIndex) as FormGroup;
            const currentDates = group.get('Dates')?.value || [];

            // Avoid duplicates
            if (!currentDates.includes(value)) {
                group.patchValue({
                    Dates: [...currentDates, value],
                    _dateInput: '' // Clear input
                });
            } else {
                group.patchValue({ _dateInput: '' });
            }
        }
    }

    removeDate(groupIndex: number, dateIndex: number) {
        const group = this.availabilities.at(groupIndex) as FormGroup;
        const currentDates = group.get('Dates')?.value || [];
        const newDates = [...currentDates];
        newDates.splice(dateIndex, 1);
        group.patchValue({ Dates: newDates });
    }

    private authService = inject(AuthService);

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['listingId']) {
                this.listingId = Number(params['listingId']);
            } else if (params['id']) {
                this.listingId = Number(params['id']);
            } else {
                console.warn('Missing listing ID');
            }
        });

        // Pre-fill user data
        const userInfo = this.authService.getFullUserInfo();
        if (userInfo) {
            this.form.patchValue({
                FullName: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
                Email: userInfo.email,
                PhoneNumber: userInfo.phoneNumber || ''
            });
        }
    }

    onFileSelect(event: any) {
        if (event.target.files) {
            const files = Array.from(event.target.files) as File[];
            this.selectedFiles = [...this.selectedFiles, ...files];
        }
    }

    removeFile(index: number) {
        this.selectedFiles.splice(index, 1);
    }

    // Validation Helpers
    get isStep1Valid(): boolean {
        const f = this.form;
        return !!(f.get('FullName')?.valid && f.get('Email')?.valid && f.get('PhoneNumber')?.valid);
    }

    get isStep2Valid(): boolean {
        // Valid if at least one availability exists
        return this.availabilities.length > 0;
    }

    get isStep3Valid(): boolean {
        const f = this.form;
        return !!(f.get('AuthorizationType')?.valid &&
            f.get('ListingAuthorizationDocument')?.valid &&
            this.selectedFiles.length > 0);
    }

    onSubmit() {
        if (this.isSubmitting) return;

        this.triedToSubmit = true;
        console.log('ListingAuthorization: onSubmit called');

        if (!this.listingId) {
            this.toastService.error('Missing listing ID. Please go back to detail page and try again.');
            return;
        }

        if (this.form.invalid) {
            console.log('ListingAuthorization: Form is invalid', this.form.errors);
            this.form.markAllAsTouched();
            this.toastService.error('Please fill all required fields correctly.');

            // Scroll to the first invalid element after DOM update
            setTimeout(() => {
                const firstInvalid = document.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.classList.add('pulse-error'); // Optional: Add a pulse animation if you have one
                }
            }, 100);
            return;
        }

        // Enforce document upload
        if (this.selectedFiles.length === 0) {
            this.toastService.error('Please upload at least one authorization document.');
            setTimeout(() => {
                const uploadZone = document.querySelector('.upload-wrapper');
                if (uploadZone) {
                    uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }

        // Enforce at least one availability
        if (this.availabilities.length === 0) {
            this.toastService.error('Please add at least one availability schedule (Contact, Virtual Tour, or In-Person).');
            return;
        }

        console.log('ListingAuthorization: Form valid, submitting...');
        this.isSubmitting = true;
        const formVal = this.form.value;

        const payload = {
            HouseListingId: this.listingId,
            ...formVal,
            Attachments: this.selectedFiles
        };

        this.housingService.createHousingAuthorization(payload).subscribe({
            next: (res: any) => {
                this.isSubmitting = false;
                console.log('ListingAuthorization: Response', res);
                if (res?.isSuccess || res?.IsSuccess) { // handling different casing from backend if unsure
                    this.toastService.success('Authorization submitted successfully!');
                    this.router.navigate(['/public/housing/details', this.listingId]);
                } else {
                    const errorMsg = res?.Error?.Message || res?.error?.message || res?.Error?.message || res?.error?.Message || 'Submission failed';
                    this.toastService.error(errorMsg);
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                console.error('ListingAuthorization: Error', err);
                // Try to extract message from error response body if available
                const errorMsg = err?.error?.Error?.Message || err?.error?.error?.message || err?.message || 'An error occurred while submitting authorization.';
                this.toastService.error(errorMsg);
            }
        });
    }
}
