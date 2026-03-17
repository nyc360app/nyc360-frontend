import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MyOffersService } from '../../service/my-offers';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-offer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-offer.html',
  styleUrls: ['./edit-offer.scss']
})
export class EditOfferComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationService = inject(Location);
  private offersService = inject(MyOffersService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef); // Inject CDR

  offerId!: number;
  editForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;

  // القوائم (Dropdowns)
  workArrangements = [
    { id: 0, name: 'On-Site' },
    { id: 1, name: 'Remote' },
    { id: 2, name: 'Hybrid' }
  ];

  employmentTypes = [
    { id: 0, name: 'Full Time' },
    { id: 1, name: 'Part Time' },
    { id: 2, name: 'Contract' },
    { id: 3, name: 'Internship' }
  ];

  employmentLevels = [
    { id: 1, name: 'Junior' },
    { id: 2, name: 'Mid' },
    { id: 3, name: 'Senior' },
    { id: 4, name: 'Executive' }
  ];

  selectedLocationName: string = '';

  ngOnInit() {
    this.offerId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadOfferDetails();
  }

  initForm() {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      requirements: [''],
      benefits: [''],
      responsibilities: [''],
      salaryMin: [null, [Validators.min(0)]],
      salaryMax: [null, [Validators.min(0)]],
      workArrangement: [0, Validators.required],
      employmentType: [0, Validators.required],
      employmentLevel: [1, Validators.required],
      locationId: [null] // Location is not editable, so we keep it optional but bound
    });
  }

  loadOfferDetails() {
    this.isLoading = true;
    this.offersService.getOfferById(this.offerId).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data?.offer) {
          const offer = res.data.offer;

          if (offer.location) {
            this.selectedLocationName = offer.location.neighborhood || offer.location.borough;
          }

          this.editForm.patchValue({
            title: offer.title,
            description: offer.description,
            requirements: offer.requirements,
            benefits: offer.benefits,
            responsibilities: offer.responsibilities,
            salaryMin: offer.salaryMin,
            salaryMax: offer.salaryMax,
            workArrangement: offer.workArrangement,
            employmentType: offer.employmentType,
            employmentLevel: offer.employmentLevel,
            locationId: offer.location?.id
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading offer:', err);
        this.toastService.error('Failed to load offer details');
        this.locationService.back();
      }
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toastService.error('Please fix the errors in the form.');
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.editForm.value;

    // Use Address object to match backend expectations from create-offer
    const address = formValue.locationId ? {
      AddressId: 0,
      LocationId: Number(formValue.locationId),
      Street: null,
      BuildingNumber: null,
      ZipCode: null
    } : null;

    const payload = {
      Title: formValue.title,
      Description: formValue.description,
      Requirements: formValue.requirements || null,
      Benefits: formValue.benefits || null,
      Responsibilities: formValue.responsibilities || null,
      SalaryMin: formValue.salaryMin !== null ? Number(formValue.salaryMin) : null,
      SalaryMax: formValue.salaryMax !== null ? Number(formValue.salaryMax) : null,
      WorkArrangement: Number(formValue.workArrangement),
      EmploymentType: Number(formValue.employmentType),
      EmploymentLevel: Number(formValue.employmentLevel),
      Address: address
    };

    console.log('Updating job with payload:', payload);

    this.offersService.updateOffer(this.offerId, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.toastService.success('Job offer updated successfully!');
          this.router.navigate(['/public/profession/my-offers']);
        } else {
          this.toastService.error(res.error?.message || 'Update failed');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.isSubmitting = false;
        this.toastService.error('Something went wrong during the update.');
        this.cdr.detectChanges();
      }
    });
  }

  // ... (goBack)
  goBack() {
    this.locationService.back();
  }
}