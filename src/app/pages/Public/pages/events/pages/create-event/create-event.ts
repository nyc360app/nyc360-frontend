import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { CreateEventService } from '../../service/create-event.service';

@Component({
    selector: 'app-create-event',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './create-event.html',
    styleUrls: ['./create-event.scss']
})
export class CreateEventComponent implements OnInit {
    private fb = inject(FormBuilder);
    private createEventService = inject(CreateEventService);
    private router = inject(Router);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    // Stepper logic
    currentStep = 1; // 1: Build Page, 2: Add Tickets, 3: Success
    createdEventId: number | null = null;
    isSubmitting = false;

    // Form Groups
    basicInfoForm: FormGroup;
    ticketsForm: FormGroup;

    // Previews
    selectedFiles: File[] = [];
    bannerPreviewUrl: string | null = null;

    // Enums based on user request
    categories = [
        { id: 1, name: 'Music', icon: 'bi-music-note-beamed' },
        { id: 2, name: 'Theater', icon: 'bi-theater-masks' },
        { id: 3, name: 'Sports', icon: 'bi-trophy' },
        { id: 4, name: 'Food & Drink', icon: 'bi-cup-hot' },
        { id: 5, name: 'Networking', icon: 'bi-people' },
        { id: 6, name: 'Community', icon: 'bi-globe' },
        { id: 7, name: 'Outdoor', icon: 'bi-tree' },
        { id: 8, name: 'Dance', icon: 'bi-activity' }
    ];

    eventTypes = [
        { id: 0, name: 'Venue', icon: 'bi-geo-alt' },
        { id: 1, name: 'Online', icon: 'bi-laptop' },
        { id: 2, name: 'To Be Announced', icon: 'bi-question-circle' }
    ];

    userRoles = [
        { id: 0, name: 'Organizer' },
        { id: 1, name: 'Co-Organizer' },
        { id: 2, name: 'Host' },
        { id: 3, name: 'Co-Host' },
        { id: 4, name: 'Promoter' },
        { id: 5, name: 'Co-Promoter' },
        { id: 6, name: 'Performer' }
    ];

    constructor() {
        this.basicInfoForm = this.fb.group({
            Title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            Description: ['', [Validators.required, Validators.minLength(20)]],
            Category: [1, Validators.required],
            Type: [0, Validators.required],
            UserRole: [0, Validators.required],
            StartDateTime: ['', Validators.required],
            EndDateTime: ['', Validators.required],
            Address: this.fb.group({
                AddressId: [0],
                LocationId: [0],
                Street: [''],
                BuildingNumber: [''],
                ZipCode: ['']
            })
        }, { validators: this.dateRangeValidator });

        this.ticketsForm = this.fb.group({
            Tiers: this.fb.array([])
        });
    }

    ngOnInit() {
        this.addTier();
    }

    dateRangeValidator(control: AbstractControl): ValidationErrors | null {
        const start = control.get('StartDateTime')?.value;
        const end = control.get('EndDateTime')?.value;
        if (start && end && new Date(start) >= new Date(end)) {
            return { dateRangeInvalid: true };
        }
        return null;
    }

    // Step 1: Submit Basic Info
    submitStep1() {
        if (this.basicInfoForm.invalid) {
            this.basicInfoForm.markAllAsTouched();
            this.toastService.error('Please fix the errors in the event details section.');
            return;
        }

        this.isSubmitting = true;
        const formData = new FormData();
        const val = this.basicInfoForm.value;

        formData.append('Title', val.Title);
        formData.append('Description', val.Description);
        formData.append('Category', val.Category.toString());
        formData.append('Type', val.Type.toString());
        formData.append('UserRole', val.UserRole.toString());
        formData.append('StartDateTime', val.StartDateTime);
        formData.append('EndDateTime', val.EndDateTime);

        // Address
        formData.append('Address.AddressId', val.Address.AddressId.toString());
        formData.append('Address.LocationId', val.Address.LocationId.toString());
        formData.append('Address.Street', val.Address.Street || '');
        formData.append('Address.BuildingNumber', val.Address.BuildingNumber || '');
        formData.append('Address.ZipCode', val.Address.ZipCode || '');

        // Attachments
        this.selectedFiles.forEach(file => {
            formData.append('Attachments', file);
        });

        this.createEventService.createEvent(formData).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                if (res.isSuccess) {
                    this.createdEventId = res.data; // res.data is the ID as per swagger
                    this.currentStep = 2;
                    this.toastService.success('Event basic info saved! Now add tickets.');
                    window.scrollTo(0, 0);
                } else {
                    this.toastService.error(res.error?.message || 'Failed to create event.');
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.error('Server error. Please try again.');
            }
        });
    }

    // Tiers Logic
    get tiers() {
        return this.ticketsForm.get('Tiers') as FormArray;
    }

    addTier() {
        const tierGroup = this.fb.group({
            Id: [0],
            Name: ['', Validators.required],
            Description: [''],
            Price: [0, [Validators.required, Validators.min(0)]],
            QuantityAvailable: [100, [Validators.required, Validators.min(1)]],
            MinPerOrder: [1, [Validators.required, Validators.min(1)]],
            MaxPerOrder: [10, [Validators.required, Validators.min(1)]],
            SaleStart: [new Date().toISOString()],
            SaleEnd: [this.basicInfoForm.value.EndDateTime || new Date().toISOString()]
        });
        this.tiers.push(tierGroup);
    }

    removeTier(index: number) {
        if (this.tiers.length > 0) {
            this.tiers.removeAt(index);
        }
    }

    // Step 2: Submit Tickets
    submitStep2() {
        if (!this.createdEventId) return;

        if (this.ticketsForm.invalid) {
            this.ticketsForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;

        // Ensure dates are valid ISO strings
        const tiersData = this.ticketsForm.value.Tiers.map((t: any) => ({
            ...t,
            SaleStart: new Date(t.SaleStart).toISOString(),
            SaleEnd: new Date(t.SaleEnd).toISOString()
        }));

        this.createEventService.updateTickets(this.createdEventId, tiersData).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                if (res.isSuccess) {
                    // Move to Step 3 (Publish Review)
                    this.currentStep = 3;
                    this.toastService.success('Tickets saved! Ready to publish.');
                    window.scrollTo(0, 0);
                } else {
                    this.toastService.error(res.error?.message || 'Failed to update tickets.');
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.error('Error updating tickets.');
            }
        });
    }

    // Step 3: Publish
    isPublished = false;

    publish() {
        if (!this.createdEventId) return;

        this.isSubmitting = true;
        this.createEventService.publishEvent(this.createdEventId).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                if (res.isSuccess) {
                    this.isPublished = true;
                    this.toastService.success('Your event is LIVE! 🚀');
                } else {
                    this.toastService.error(res.error?.message || 'Publishing failed.');
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.error(err.error?.message || 'Server error during publishing.');
            }
        });
    }

    // Media Handling
    onFileSelect(event: any) {
        if (event.target.files.length > 0) {
            this.handleFiles(Array.from(event.target.files) as File[]);
        }
    }

    onFileDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.handleFiles(Array.from(event.dataTransfer.files) as File[]);
        }
    }

    private handleFiles(files: File[]) {
        this.selectedFiles = [...this.selectedFiles, ...files];
        if (this.selectedFiles.length > 0) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.bannerPreviewUrl = e.target.result;
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(this.selectedFiles[0]);
        }
    }

    removeFile(index: number) {
        this.selectedFiles.splice(index, 1);
        if (this.selectedFiles.length === 0) this.bannerPreviewUrl = null;
    }

    // Helper functions for Preview
    getStepTitle() {
        if (this.currentStep === 1) return 'Build event page';
        if (this.currentStep === 2) return 'Add tickets';
        return 'Publish';
    }

    finish() {
        this.router.navigate(['/public/events/list']);
    }
}
