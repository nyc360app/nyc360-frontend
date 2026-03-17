import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { CreateOfferService } from '../../service/create-offer';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-create-offer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-offer.html',
  styleUrls: ['./create-offer.scss']
})
export class CreateOfferComponent implements OnInit {
  private fb = inject(FormBuilder);
  private offerService = inject(CreateOfferService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef); // Inject CDR

  isSubmitting = false;
  locationSearchControl = new FormControl('');
  locationResults: any[] = [];
  showLocationResults = false;
  isSearchingLocation = false;

  // ✅ Validation for all fields - Adjusting to match backend (required vs optional)
  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    responsibilities: [''], // Optional
    requirements: [''],     // Optional
    benefits: [''],         // Optional
    salaryMin: [null, [Validators.min(0)]], // Optional
    salaryMax: [null, [Validators.min(0)]], // Optional
    workArrangement: [0, Validators.required],
    employmentType: [0, Validators.required],
    employmentLevel: [1, Validators.required],
    locationId: [null],     // 🛠️ Now Optional
    street: [''],           // Optional
    buildingNumber: [''],   // Optional
    zipCode: ['', [Validators.pattern('^[0-9]*$')]]
  });

  ngOnInit() {
    this.setupLocationSearch();
  }

  // ✅ Helper for template validation display
  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  setupLocationSearch() {
    this.locationSearchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      const query = (term || '').trim();

      if (query.length < 2) {
        this.locationResults = [];
        this.showLocationResults = false;
        this.isSearchingLocation = false;
        // If they cleared the search, clear the location data
        if (query.length === 0) {
          this.form.patchValue({ locationId: null, zipCode: '' });
        }
        this.cdr.detectChanges();
        return;
      }

      this.isSearchingLocation = true;
      this.cdr.detectChanges();

      this.offerService.searchLocations(query).subscribe({
        next: (res) => {
          this.isSearchingLocation = false;
          if (res.isSuccess) {
            this.locationResults = res.data || [];
            this.showLocationResults = this.locationResults.length > 0;
          } else {
            this.locationResults = [];
            this.showLocationResults = false;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSearchingLocation = false;
          this.locationResults = [];
          this.showLocationResults = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  selectLocation(loc: any) {
    this.form.patchValue({
      locationId: loc.id,
      zipCode: loc.zipCode || ''
    });
    this.locationSearchControl.setValue(`${loc.neighborhood}, ${loc.borough}`, { emitEvent: false });
    this.showLocationResults = false;
    this.cdr.detectChanges();
  }

  onZipCodeBlur() {
    const zip = this.form.get('zipCode')?.value;
    console.log('Zip code blur triggered:', zip);

    if (zip && zip.length >= 3) { // NYC zip codes are 5 digits, 2-3 is a good minimum to start searching
      this.isSearchingLocation = true;
      this.showLocationResults = false;
      this.cdr.detectChanges();

      this.offerService.searchLocations(zip).subscribe({
        next: (res) => {
          console.log('Zip search results:', res);
          this.isSearchingLocation = false;
          if (res.isSuccess && res.data && res.data.length > 0) {
            if (res.data.length === 1) {
              console.log('Auto-selecting single result:', res.data[0]);
              this.selectLocation(res.data[0]);
            } else {
              console.log('Showing multiple results for zip:', res.data.length);
              this.locationResults = res.data;
              this.showLocationResults = true;
            }
          } else {
            console.log('No locations found for zip:', zip);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Zip search error:', err);
          this.isSearchingLocation = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.scrollToFirstInvalidControl();
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();
    const val = this.form.value;

    // ✅ Transform to PascalCase and match backend expected record structure
    // If no locationId, Address should be null as per the record definition nullable Address
    const address = val.locationId ? {
      AddressId: 0,
      LocationId: Number(val.locationId),
      Street: val.street || null,
      BuildingNumber: val.buildingNumber || null,
      ZipCode: val.zipCode ? String(val.zipCode) : null
    } : null;

    const payload = {
      Title: val.title,
      Description: val.description,
      Requirements: val.requirements || null,
      Benefits: val.benefits || null,
      Responsibilities: val.responsibilities || null,
      SalaryMin: val.salaryMin !== null ? Number(val.salaryMin) : null,
      SalaryMax: val.salaryMax !== null ? Number(val.salaryMax) : null,
      WorkArrangement: Number(val.workArrangement),
      EmploymentType: Number(val.employmentType),
      EmploymentLevel: Number(val.employmentLevel),
      Address: address
    };

    this.offerService.createOffer(payload as any).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.toastService.success('Job Offer Created Successfully!');
          this.router.navigate(['/public/job-profile', res.data]);
        } else {
          this.toastService.error(res.error?.message || 'Failed to create offer');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('Server Error: Make sure all fields are valid.');
        this.cdr.detectChanges();
      }
    });
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl = document.querySelector('form .ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = firstInvalidControl.querySelector('input, select, textarea') as HTMLElement;
      if (input) input.focus();
    }
  }
}