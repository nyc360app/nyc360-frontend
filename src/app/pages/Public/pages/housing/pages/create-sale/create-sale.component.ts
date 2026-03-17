import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PostsService } from '../../../../pages/posts/services/posts';
import { HousingSubmissionService } from '../../service/housing-submission.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { formatDate } from '@angular/common';

@Component({
    selector: 'app-create-sale',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './create-sale.html',
    styleUrls: ['../create-housing/create-housing.scss'] // Reusing the same premium styles
})
export class CreateSaleComponent implements OnInit {
    private fb = inject(FormBuilder);
    private postsService = inject(PostsService);
    private housingService = inject(HousingSubmissionService);
    private router = inject(Router);
    private toastService = inject(ToastService);
    protected imageService = inject(ImageService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    today = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');

    form: FormGroup;
    isSubmitting = false;
    triedToSubmit = false;

    // --- Options ---
    houseTypes = [
        { id: 0, name: 'Apartment', icon: 'bi-building' },
        { id: 1, name: 'House', icon: 'bi-house-door' },
        { id: 2, name: 'Townhouse', icon: 'bi-houses' },
        { id: 3, name: 'Studio', icon: 'bi-grid-1x2' }
    ];

    propertyTypes = [
        { id: 0, name: 'Single-Family' },
        { id: 1, name: 'Multi-Family' }
    ];

    buildingTypes = [
        { id: 0, name: 'Walk-Up' },
        { id: 1, name: 'Elevator Building' },
        { id: 2, name: 'Townhouse / Brownstone' },
        { id: 3, name: 'Detached / Semi-Detached' }
    ];

    heatingSystems = [
        { id: 0, name: 'Steam / Radiator (Central)' },
        { id: 1, name: 'Hot Water (Central)' },
        { id: 2, name: 'Electric Baseboard' },
        { id: 3, name: 'Forced Air (Heat)' },
        { id: 4, name: 'Heat Pump / Mini-Split' },
        { id: 5, name: 'Other' }
    ];

    coolingSystems = [
        { id: 0, name: 'Central AC' },
        { id: 1, name: 'Ductless Mini-Split' },
        { id: 2, name: 'Window Units Allowed' },
        { id: 3, name: 'Through-Wall Units' },
        { id: 4, name: 'No AC' }
    ];

    tempControls = [
        { id: 0, name: 'Individual Thermostat' },
        { id: 1, name: 'Building / Shared Control' },
        { id: 2, name: 'Smart Thermostat' }
    ];

    laundryTypes = [
        { id: 0, name: 'In-Unit' },
        { id: 1, name: 'In-Building' },
        { id: 2, name: 'Nearby' }
    ];

    amenityOptions = [
        { id: 0, name: 'Fitness Center' },
        { id: 1, name: 'Wellness Spa' },
        { id: 2, name: 'Outdoor Spaces' },
        { id: 3, name: 'Co-working Space' },
        { id: 4, name: 'Lobby' },
        { id: 5, name: 'Indoor Lounges' },
        { id: 6, name: 'Bike Room' },
        { id: 7, name: 'Parking' },
        { id: 8, name: 'Security Attendant' },
        { id: 9, name: 'Internet' },
        { id: 10, name: 'Cable' }
    ];

    buyerPrograms = [
        { id: 0, name: 'First-Time Homebuyer Program' },
        { id: 1, name: 'FHA Loan Eligibility' },
        { id: 2, name: 'VA Loan Eligibility' },
        { id: 3, name: 'SONYMA' },
        { id: 4, name: 'HPD Homeowner Incentive' },
        { id: 5, name: 'Good Neighbor Next Door' },
        { id: 6, name: 'Down Payment Assistance' },
        { id: 7, name: 'Section 8 Homeownership' },
        { id: 8, name: 'HomeFirst Grant' },
        { id: 9, name: 'Other Buyer Assistance' }
    ];

    years: number[] = [];

    boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'];

    // --- State ---
    selectedFiles: File[] = [];
    imagePreviews: { url: SafeUrl, type: 'image' | 'video' | 'file', name?: string }[] = [];
    locationSearch$ = new Subject<string>();
    locationResults: any[] = [];
    selectedLocation: any = null;
    showLocationDropdown = false;

    private sanitizer = inject(DomSanitizer);

    constructor() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 1900; i--) {
            this.years.push(i);
        }
        // ... constructor continues

        this.form = this.fb.group({
            HouseType: [0, Validators.required],
            OpeningDate: [this.today, Validators.required],
            PropertyType: [null, Validators.required],
            Borough: ['', Validators.required],
            ZipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
            SuggestedOccupants: [null],
            locationInput: ['', Validators.required],
            Address: this.fb.group({
                Neighborhood: ['', Validators.required],
                FullAddress: [''],
                UnitNumber: [''],
                GoogleMap: ['']
            }),
            NearbyTransportation: [[]],
            Bedrooms: [1, [Validators.required, Validators.min(0)]],
            Bathrooms: [1, [Validators.required, Validators.min(0)]],
            AskingPrice: [null, [Validators.required, Validators.min(1)]],
            DownPayment: [null],
            BrokerFee: [null],
            MonthlyCostRange: [null],
            BuildingType: [0, Validators.required],
            BuiltIn: [null],
            RenovatedIn: [null],
            Sqft: [null],
            FloorLevel: [null],
            Heating: [null],
            Cooling: [null],
            TemperatureControl: [null],
            Laundry: [[]],
            Amenities: [[]],
            Furnished: [false],
            AcceptsHousingVouchers: [false],
            FamilyAndKidsFriendly: [false],
            PetsFriendly: [false],
            AccessibilityFriendly: [false],
            SmokingAllowed: [false],
            AcceptedBuyerPrograms: [[]],
            Description: ['', [Validators.required, Validators.minLength(20)]],
            AddDirectApplyLink: [false],
            DirectApplyLink: [''],
            AllowColisterEditing: [true],
            IsPublished: [true],
            LegalUnitCount: [1],
            CoListing: [[]]
        });
    }

    ngOnInit() {
        this.setupSearch();
    }

    get f() { return this.form.controls; }
    get addressGroup() { return this.form.get('Address') as FormGroup; }

    isSectionValid(section: string): boolean {
        const controls = this.form.controls;
        switch (section) {
            case 'availability':
                return controls['OpeningDate'].valid && controls['PropertyType'].valid;
            case 'location':
                return controls['Borough'].valid && controls['ZipCode'].valid && controls['locationInput'].valid;
            case 'financials':
                return controls['AskingPrice'].valid;
            case 'details':
                return controls['Bedrooms'].valid && controls['Bathrooms'].valid && controls['BuildingType'].valid;
            case 'description':
                return controls['Description'].valid;
            case 'photos':
                return this.selectedFiles.length > 0;
            default:
                return false;
        }
    }

    setupSearch() {
        this.locationSearch$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.length < 2) return of([]);
                return this.postsService.searchLocations(term).pipe(catchError(() => of([])));
            })
        ).subscribe((res: any) => {
            const data = (res as any).data || [];
            this.locationResults = data;
            this.showLocationDropdown = this.locationResults.length > 0;
            this.cdr.detectChanges();
        });
    }

    onLocationInput(event: any) { this.locationSearch$.next(event.target.value); }

    selectLocation(loc: any) {
        this.selectedLocation = loc;
        this.form.patchValue({
            locationInput: loc.neighborhood,
            Borough: loc.borough,
            ZipCode: loc.zipCode ? String(loc.zipCode) : ''
        });
        this.addressGroup.patchValue({ Neighborhood: loc.neighborhood });
        this.showLocationDropdown = false;
    }

    toggleTransport(id: number) {
        const current = this.form.get('NearbyTransportation')?.value || [];
        this.form.patchValue({ NearbyTransportation: current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id] });
    }

    toggleLaundry(id: number) {
        const current = this.form.get('Laundry')?.value || [];
        this.form.patchValue({ Laundry: current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id] });
    }

    toggleAmenity(id: number) {
        const current = this.form.get('Amenities')?.value || [];
        this.form.patchValue({ Amenities: current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id] });
    }

    toggleProgram(id: number) {
        const current = this.form.get('AcceptedBuyerPrograms')?.value || [];
        this.form.patchValue({ AcceptedBuyerPrograms: current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id] });
    }

    onFileSelect(event: any) {
        if (event.target.files) {
            const files = Array.from(event.target.files) as File[];
            this.selectedFiles = [...this.selectedFiles, ...files];
            files.forEach(file => {
                let type: 'image' | 'video' | 'file' = 'image';
                if (file.type.startsWith('video')) {
                    type = 'video';
                } else if (file.type.startsWith('image')) {
                    type = 'image';
                } else {
                    type = 'file';
                }

                const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
                this.imagePreviews.push({ url, type, name: file.name });
            });
            this.cdr.detectChanges();
        }
    }

    removeFile(index: number) {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    onSubmit(isPublished: boolean = true) {
        this.triedToSubmit = true;
        this.cdr.markForCheck();

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.scrollToFirstInvalidControl();
            this.toastService.error('Please fill in valid data.');
            return;
        }

        // --- ENFORCE MEDIA CHECK ---
        if (this.selectedFiles.length === 0) {
            this.toastService.error('Please upload at least one photo or video of the property.');
            const uploadZone = document.querySelector('.photo-upload-zone-premium');
            if (uploadZone) {
                uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                uploadZone.classList.add('error-pulse');
                setTimeout(() => uploadZone.classList.remove('error-pulse'), 2000);
            }
            return;
        }

        this.isSubmitting = true;
        this.form.patchValue({ IsPublished: isPublished });

        const raw = this.form.getRawValue();
        const payload = {
            ...raw,
            Neighborhood: raw.Address.Neighborhood,
            FullAddress: raw.Address.FullAddress,
            UnitNumber: raw.Address.UnitNumber,
            GoogleMap: raw.Address.GoogleMap,
            Photos: this.selectedFiles
        };

        this.housingService.createSalePost(payload).subscribe({
            next: (res: any) => {
                this.isSubmitting = false;
                if (res?.isSuccess) {
                    let newId = res.data;
                    if (res.data && typeof res.data === 'object') {
                        newId = res.data.id || res.data.housingId || res.data.Id || res.data.HousingId;
                    }
                    console.log('Sale API Response:', res);
                    console.log('Extracted New ID:', newId);

                    if (newId) {
                        if (isPublished) {
                            this.router.navigate(['/public/housing/listing-authorization'], { queryParams: { id: newId } });
                        } else {
                            this.router.navigate(['/public/housing/details', newId]);
                        }
                    } else {
                        console.warn('Could not extract new listing ID', res);
                        this.router.navigate(['/public/housing/home']);
                    }
                } else {
                    this.toastService.error(res?.error?.message || 'Failed');
                }
            },
            error: () => {
                this.isSubmitting = false;
                this.toastService.error('Error publishing listing');
            }
        });
    }

    scrollToFirstInvalidControl() {
        const firstInvalidControl: HTMLElement = document.querySelector(
            '.ng-invalid[formControlName], .ng-invalid[formGroupName], .ng-invalid select, .ng-invalid input, .ng-invalid textarea'
        ) as HTMLElement;
        if (firstInvalidControl) {
            firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidControl.classList.add('error-pulse');
            setTimeout(() => firstInvalidControl.classList.remove('error-pulse'), 2000);
            firstInvalidControl.focus();
        }
    }

    transportationGroups = [
        {
            category: 'Subway Lines',
            icon: 'bi-train-front',
            options: [
                { id: 1, name: '1/2/3' },
                { id: 2, name: '4/5/6' },
                { id: 4, name: '7' },
                { id: 8, name: 'A/C/E' },
                { id: 16, name: 'B D F M' },
                { id: 32, name: 'G' },
                { id: 64, name: 'J Z' },
                { id: 128, name: 'L' },
                { id: 256, name: 'N Q R W' },
                { id: 512, name: 'S' }
            ]
        },
        {
            category: 'Bus Access',
            icon: 'bi-bus-front',
            options: [
                { id: 1024, name: 'Local Bus' },
                { id: 2048, name: 'Limited Bus' },
                { id: 4096, name: 'Select Bus Service (SBS)' },
                { id: 8192, name: '24-Hour Bus Route' }
            ]
        },
        {
            category: 'Regional Rail',
            icon: 'bi-train-lightrail-front',
            options: [
                { id: 16384, name: 'LIRR' },
                { id: 32768, name: 'Metro-North' },
                { id: 65536, name: 'PATH' }
            ]
        }
    ];
}
