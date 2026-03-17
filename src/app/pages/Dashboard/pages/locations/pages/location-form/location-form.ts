import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LocationDashboardService } from '../../service/location-dashboard.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { LocationRequest } from '../../models/location.model';

@Component({
    selector: 'app-location-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './location-form.html',
    styleUrls: ['./location-form.scss']
})
export class LocationFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private locationsService = inject(LocationDashboardService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);

    form: FormGroup;
    isEditMode = false;
    locationId: number | null = null;
    isLoading = false;
    isSubmitting = false;

    boroughs = [
        'Manhattan',
        'Brooklyn',
        'Queens',
        'Bronx',
        'Staten Island'
    ];

    constructor() {
        this.form = this.fb.group({
            borough: ['', [Validators.required]],
            code: ['', [Validators.required]],
            neighborhoodNet: ['', [Validators.required]],
            neighborhood: ['', [Validators.required]],
            zipCode: [null, [Validators.required, Validators.pattern('^[0-9]{5}$')],]
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.locationId = +params['id'];
                this.loadLocationData(this.locationId);
            }
        });
    }

    loadLocationData(id: number) {
        this.isLoading = true;
        // Since we don't have a direct "Get Single" API in the user's list, 
        // but the service has a placeholder, let's try it or use a fallback.
        this.locationsService.getLocationById(id).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess && res.data) {
                    const loc = res.data;
                    this.form.patchValue({
                        borough: loc.borough,
                        code: loc.code,
                        neighborhoodNet: loc.neighborhoodNet,
                        neighborhood: loc.neighborhood,
                        zipCode: loc.zipCode
                    });
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.toastService.error('Failed to load location data');
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastService.error('Please fill in all required fields');
            return;
        }

        this.isSubmitting = true;
        const rawValue = this.form.value;

        const payload: LocationRequest = {
            Borough: rawValue.borough,
            Code: rawValue.code,
            NeighborhoodNet: rawValue.neighborhoodNet,
            Neighborhood: rawValue.neighborhood,
            ZipCode: Number(rawValue.zipCode)
        };

        const request$ = this.isEditMode && this.locationId
            ? this.locationsService.updateLocation(this.locationId, payload)
            : this.locationsService.createLocation(payload);

        request$.subscribe({
            next: (res) => {
                this.isSubmitting = false;
                if (res.isSuccess) {
                    this.toastService.success(this.isEditMode ? 'Location updated successfully' : 'Location created successfully');
                    this.router.navigate(['/admin/locations']);
                } else {
                    this.toastService.error(res.error?.message || 'Operation failed');
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.error('An error occurred. Please try again.');
            }
        });
    }
}
