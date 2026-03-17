import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegistrationService } from '../../Service/registration-service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CATEGORY_THEMES } from '../../../Public/Widgets/feeds/models/categories';
import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';

// Enums as requested
export enum VisitPurpose {
    Tourism = 0,
    Business = 1,
    Education = 2,
    Visiting_Family_or_Friends = 3,
    Other = 4
}

export enum VisitingLengthOfStay {
    Day = 0,
    Week = 1,
    Extended = 2
}

@Component({
    selector: 'app-register-visitor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,  AuthSuccessModalComponent],
    templateUrl: './register-visitor.html',
    styleUrls: ['./register-visitor.scss']
})
export class RegisterVisitorComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private registrationService = inject(RegistrationService);
    private toastService = inject(ToastService);

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

    visitPurposes = [
        { value: VisitPurpose.Tourism, label: 'Tourism' },
        { value: VisitPurpose.Business, label: 'Business' },
        { value: VisitPurpose.Education, label: 'Education' },
        { value: VisitPurpose.Visiting_Family_or_Friends, label: 'Visiting Family/Friends' },
        { value: VisitPurpose.Other, label: 'Other' }
    ];

    lengthsOfStay = [
        { value: VisitingLengthOfStay.Day, label: 'Day Trip' },
        { value: VisitingLengthOfStay.Week, label: 'Up to a Week' },
        { value: VisitingLengthOfStay.Extended, label: 'Extended Stay' }
    ];

    // Modal State
    showModal = false;
    modalTitle = 'Welcome to NYC!';
    modalMessage = '';

    constructor() {
        this.initForm();
    }

    initForm() {
        this.form = this.fb.group({
            FirstName: ['', [Validators.required, Validators.minLength(2)]],
            LastName: ['', [Validators.required, Validators.minLength(2)]],
            Username: ['', [Validators.required, Validators.minLength(4)]],
            Email: ['', [Validators.required, Validators.email]],
            Password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*\d).{6,}$/)]],
            CityOfOrigin: ['', Validators.required],
            CountryOfOrigin: ['', Validators.required],
            VisitPurpose: [null, Validators.required],
            LengthOfStay: [null, Validators.required],
            ReceiveEventAndCultureRecommendations: [true],
            EnableLocationBasedSuggestions: [true],
            SavePlacesEventsGuides: [true],
            DiscoverableProfile: [true],
            AllowMessagesFromNycPartners: [true]
        });
    }

    toggleInterest(id: number) {
        const index = this.selectedInterestIds.indexOf(id);
        const category = this.interestsList.find(c => c.id === id);
        if (index >= 0) {
            this.selectedInterestIds.splice(index, 1);
            this.toastService.info(`Removed ${category?.name} from interests.`);
        } else {
            this.selectedInterestIds.push(id);
            this.toastService.success(`Added ${category?.name} to interests.`);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedInterestIds.includes(id);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
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
            this.toastService.warning('Please select at least one interest to personalize your experience.');
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        const payload = {
            ...formValue,
            Interests: this.selectedInterestIds
        };

        console.log('Sending Payload:', payload);

        this.registrationService.registerVisitor(payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess) {
                    this.modalTitle = 'Welcome, Visitor!';
                    this.modalMessage = 'Your visitor profile has been created successfully. Enjoy exploring NYC!';
                    this.showModal = true;
                } else {
                    this.toastService.error(res.error?.message || 'Registration failed.');
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.toastService.error('An error occurred. Please try again.');
                console.error(err);
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
