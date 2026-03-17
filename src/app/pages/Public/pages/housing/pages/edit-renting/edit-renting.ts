import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PostsService } from '../../../../pages/posts/services/posts';
import { HousingViewService } from '../../service/housing-view.service';
import { HousingSubmissionService } from '../../service/housing-submission.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { formatDate } from '@angular/common';

@Component({
    selector: 'app-edit-renting',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './edit-renting.html',
    styleUrls: ['../create-housing/create-housing.scss']
})
export class EditRentingComponent implements OnInit {
    private fb = inject(FormBuilder);
    private postsService = inject(PostsService);
    private housingViewService = inject(HousingViewService);
    private housingSubmissionService = inject(HousingSubmissionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);
    protected imageService = inject(ImageService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private sanitizer = inject(DomSanitizer);

    today = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    isOrganization = false;
    postId: number | null = null;
    isLoading = true;

    form: FormGroup;
    isSubmitting = false;

    // --- Options ---
    houseTypes = [
        { id: 0, name: 'Apartment', icon: 'bi-building' },
        { id: 1, name: 'House', icon: 'bi-house-door' },
        { id: 2, name: 'Townhouse', icon: 'bi-houses' },
        { id: 3, name: 'Studio', icon: 'bi-grid-1x2' },
        { id: 4, name: 'Room', icon: 'bi-person-badge' }
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

    leaseTypes = [
        { id: 0, name: 'Lease' },
        { id: 1, name: 'Sub-Lease' },
        { id: 2, name: 'Month-to-Month' },
        { id: 3, name: 'Stabilized' },
        { id: 4, name: 'Flexible' }
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
        { id: 8, name: 'Security Attendant' }
    ];

    housingPrograms = [
        { id: 0, name: 'Section 8 (Housing Choice Voucher)' },
        { id: 1, name: 'CityFHEPS' },
        { id: 2, name: 'FHEPS' },
        { id: 3, name: 'HASA' },
        { id: 4, name: 'SOTA (One-Time Assistance)' },
        { id: 5, name: 'Housing Connect / Lottery' },
        { id: 6, name: 'Other Housing Assistance Programs' },
        { id: 7, name: 'Not Accepted' }
    ];

    years: number[] = [];
    floors: string[] = ['Ground', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10+'];
    boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'];

    // --- State ---
    selectedFiles: File[] = [];
    imagePreviews: { url: SafeUrl | string, type: 'image' | 'video' | 'file', name?: string, isExisting?: boolean, id?: number }[] = [];
    existingAttachments: any[] = [];
    deletedPhotoIds: number[] = [];
    locationSearch$ = new Subject<string>();
    locationResults: any[] = [];
    selectedLocation: any = null;
    showLocationDropdown = false;

    openSections: { [key: string]: boolean } = {
        availability: true,
        location: true,
        address: true,
        details: true,
        features: true,
        programs: false,
        rentingDetails: true,
        description: true
    };

    constructor() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 1900; i--) {
            this.years.push(i);
        }

        this.form = this.fb.group({
            HouseType: [0, Validators.required],
            MoveInDate: [null, Validators.required],
            MoveOutDate: [null],
            PropertyType: [null, Validators.required],
            Borough: ['', Validators.required],
            ZipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
            MaxOccupants: [null],
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
            MonthlyRent: [null, [Validators.required, Validators.min(1)]],
            SecurityDeposit: [null],
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
            ShortTermStayAllowed: [false],
            ShortStayEligiblity: [false],
            Furnished: [false],
            AcceptsHousingVouchers: [false],
            FamilyAndKidsFriendly: [false],
            PetsFriendly: [false],
            AccessibilityFriendly: [false],
            SmokingAllowed: [false],
            AcceptedHousingPrograms: [[]],
            Description: ['', [Validators.required, Validators.minLength(20)]],
            LeaseType: [0, Validators.required],
            PrivacyType: [0, Validators.required],
            SharedBathroomType: [0],
            SharedKitchenType: [0],
            AboutCurrentResident: [''],
            UnitRulesAndPolicies: [''],
            RoommatesGroupChat: [''],
            IsPublished: [true],
            AddDirectApplyLink: [false],
            DirectApplyLink: [''],
            CoListing: [[]],
            AllowColisterEditing: [true]
        });

        this.isOrganization = this.authService.hasRole('Organization');
    }

    ngOnInit() {
        this.setupSearch();
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.postId = +id;
                this.loadListingData(this.postId);
            }
        });
    }

    loadListingData(id: number) {
        this.isLoading = true;
        this.housingViewService.getHousingDetails(id).subscribe({
            next: (res: any) => {
                if (res.isSuccess) {
                    const data = res.data.info || res.data;
                    this.populateForm(data);
                } else {
                    this.toastService.error('Failed to load listing');
                    this.router.navigate(['/public/housing/home']);
                }
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.toastService.error('Error loading listing');
                this.router.navigate(['/public/housing/home']);
            }
        });
    }

    populateForm(data: any) {
        this.form.patchValue({
            HouseType: data.houseType !== undefined ? data.houseType : data.buildingType,
            MoveInDate: (data.moveInDate || data.moveInOrOpeningDate) ? (data.moveInDate || data.moveInOrOpeningDate).split('T')[0] : null,
            MoveOutDate: data.moveOutDate ? data.moveOutDate.split('T')[0] : null,
            PropertyType: data.propertyType,
            Borough: data.borough || data.address?.location?.borough || '',
            ZipCode: data.zipCode || data.address?.zipCode || '',
            MaxOccupants: data.maxOccupants ?? data.maxOrSuggestedOccupants,
            locationInput: data.neighborhood || data.address?.location?.neighborhood || '',
            NearbyTransportation: data.nearbyTransportation || data.nearbySubwayLines || [],
            Bedrooms: data.bedrooms ?? data.numberOfRooms,
            Bathrooms: data.bathrooms ?? data.numberOfBathrooms,
            MonthlyRent: data.monthlyRent || data.startingOrAskingPrice || data.startingPrice,
            SecurityDeposit: data.securityDeposit ?? data.securityDepositOrDownPayment,
            BrokerFee: data.brokerFee,
            MonthlyCostRange: data.monthlyCostRange,
            BuildingType: data.buildingType !== undefined ? data.buildingType : data.houseType,
            BuiltIn: data.builtIn || data.yearBuilt,
            RenovatedIn: data.renovatedIn,
            Sqft: data.sqft || data.size,
            FloorLevel: data.floorLevel,
            Heating: data.heating !== undefined ? data.heating : data.heatingSystem,
            Cooling: data.cooling !== undefined ? data.cooling : data.coolingSystem,
            TemperatureControl: data.temperatureControl,
            Laundry: data.laundry || data.laundryTypes || [],
            Amenities: data.amenities || [],
            ShortTermStayAllowed: data.shortTermStayAllowed ?? data.isShortTermStayAllowed ?? false,
            ShortStayEligiblity: data.shortStayEligiblity ?? data.isShortStayEligible ?? false,
            Furnished: data.furnished ?? data.isFurnished ?? false,
            AcceptsHousingVouchers: data.acceptsHousingVouchers ?? data.isAcceptsHousingVouchers ?? false,
            FamilyAndKidsFriendly: data.familyAndKidsFriendly ?? data.isFamilyAndKidsFriendly ?? false,
            PetsFriendly: data.petsFriendly ?? data.isPetsFriendly ?? false,
            AccessibilityFriendly: data.accessibilityFriendly ?? data.isAccessibilityFriendly ?? false,
            SmokingAllowed: data.smokingAllowed ?? data.isSmokingAllowed ?? false,
            AcceptedHousingPrograms: data.acceptedHousingPrograms || data.rentHousingPrograms || [],
            Description: data.description,
            LeaseType: data.leaseType !== undefined ? data.leaseType : data.rentingLeaseType,
            PrivacyType: data.privacyType ?? data.rentPrivacyType ?? (data.rentingIsShared ? 1 : 0),
            SharedBathroomType: data.sharedBathroomType ?? data.rentBathroomType ?? (data.rentingIsSharedBathroom ? 1 : 0),
            SharedKitchenType: data.sharedKitchenType ?? data.rentKitchenType ?? (data.rentingIsSharedKitchen ? 1 : 0),
            AboutCurrentResident: data.aboutCurrentResident || data.rentingAboutCurrentResident,
            UnitRulesAndPolicies: data.unitRulesAndPolicies || data.rentingRulesAndPolicies,
            RoommatesGroupChat: data.roommatesGroupChat || data.rentingRoommateGroupChat,
            AddDirectApplyLink: data.addDirectApplyLink,
            DirectApplyLink: data.directApplyLink,
            AllowColisterEditing: data.allowColisterEditing
        });

        this.addressGroup.patchValue({
            Neighborhood: data.neighborhood || data.address?.location?.neighborhood || '',
            FullAddress: data.fullAddress || data.address?.street || '',
            UnitNumber: data.unitNumber,
            GoogleMap: data.googleMap || data.googleMapLink
        });

        // Robust Attachment Mapping
        const attachments = data.attachments || [];
        this.existingAttachments = attachments.map((att: any) => {
            if (typeof att === 'string') return { url: att, id: null };
            return {
                url: att.url || att.imageUrl || '',
                id: att.id || att.attachmentId || null
            };
        });

        // Initialize previews with existing attachments
        this.imagePreviews = this.existingAttachments.map(att => {
            let type: 'image' | 'video' | 'file' = 'image';
            const lowerUrl = (att.url || '').toLowerCase();
            if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm')) {
                type = 'video';
            } else if (lowerUrl.endsWith('.pdf') || lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.txt')) {
                type = 'file';
            }

            // Resolve URL immediately
            const resolvedUrl = this.imageService.resolveImageUrl(att.url, 'housing');

            return {
                url: resolvedUrl,
                type: type,
                isExisting: true,
                id: att.id || undefined
            };
        });

        // If there's a top-level imageUrl not in attachments, add it
        if (data.imageUrl && !this.existingAttachments.some(a => a.url === data.imageUrl)) {
            const lowerUrl = (data.imageUrl || '').toLowerCase();
            let type: 'image' | 'video' | 'file' = 'image';
            if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm')) {
                type = 'video';
            }

            const resolvedUrl = this.imageService.resolveImageUrl(data.imageUrl, 'housing');

            this.imagePreviews.unshift({
                url: resolvedUrl,
                id: undefined,
                type: type,
                isExisting: true
            });
        }


        this.cdr.detectChanges();
    }

    get f() { return this.form.controls; }
    get addressGroup() { return this.form.get('Address') as FormGroup; }

    isSectionValid(section: string): boolean {
        const controls = this.form.controls;
        switch (section) {
            case 'availability': return controls['MoveInDate'].valid && controls['PropertyType'].valid;
            case 'location': return controls['Borough'].valid && controls['ZipCode'].valid && controls['locationInput'].valid;
            case 'financials': return controls['MonthlyRent'].valid;
            case 'details': return controls['Bedrooms'].valid && controls['Bathrooms'].valid && controls['BuildingType'].valid;
            case 'description': return controls['Description'].valid;
            default: return false;
        }
    }

    toggleSection(section: string) {
        this.openSections[section] = !this.openSections[section];
        this.cdr.detectChanges();
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
        if (current.includes(id)) {
            this.form.patchValue({ NearbyTransportation: current.filter((x: number) => x !== id) });
        } else {
            this.form.patchValue({ NearbyTransportation: [...current, id] });
        }
    }

    toggleLaundry(id: number) {
        const current = this.form.get('Laundry')?.value || [];
        if (current.includes(id)) {
            this.form.patchValue({ Laundry: current.filter((x: number) => x !== id) });
        } else {
            this.form.patchValue({ Laundry: [...current, id] });
        }
    }

    toggleAmenity(id: number) {
        const current = this.form.get('Amenities')?.value || [];
        if (current.includes(id)) {
            this.form.patchValue({ Amenities: current.filter((x: number) => x !== id) });
        } else {
            this.form.patchValue({ Amenities: [...current, id] });
        }
    }

    toggleProgram(id: number) {
        const current = this.form.get('AcceptedHousingPrograms')?.value || [];
        if (current.includes(id)) {
            this.form.patchValue({ AcceptedHousingPrograms: current.filter((x: number) => x !== id) });
        } else {
            this.form.patchValue({ AcceptedHousingPrograms: [...current, id] });
        }
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
                this.imagePreviews.push({ url, type, name: file.name, isExisting: false });
            });
            this.cdr.detectChanges();
        }
    }

    removeFile(index: number) {
        const item = this.imagePreviews[index];
        if (item.isExisting && item.id) {
            this.removeExistingFile(index, item.id); // This will handle removal from logic
        } else {
            // It's a new file
            // We need to find the corresponding file in selectedFiles. 
            // Since imagePreviews includes both existing and new, the index doesn't match selectedFiles directly.
            // We need to count how many new files are before this index.
            let newFileIndex = 0;
            for (let i = 0; i < index; i++) {
                if (!this.imagePreviews[i].isExisting) {
                    newFileIndex++;
                }
            }
            this.selectedFiles.splice(newFileIndex, 1);
        }
        this.imagePreviews.splice(index, 1);
    }

    removeExistingFile(index: number, id: number) {
        // this.existingAttachments.splice(index, 1); // remove from tracking?
        this.deletedPhotoIds.push(id);
    }

    onSubmit(isPublished: boolean = true) {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.scrollToFirstInvalidControl();
            this.toastService.error('Please fill in valid data.');
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
            NewPhotos: this.selectedFiles,
            DeletedPhotoIds: this.deletedPhotoIds
        };

        if (this.postId) {
            this.housingSubmissionService.updateRentingPost(this.postId, payload).subscribe({
                next: (res: any) => {
                    this.isSubmitting = false;
                    if (res?.isSuccess) {
                        this.toastService.success('Listing Updated!');
                        this.router.navigate(['/public/housing/details', this.postId]);
                    } else {
                        this.toastService.error(res?.error?.message || 'Failed');
                    }
                },
                error: () => {
                    this.isSubmitting = false;
                    this.toastService.error('Error updating listing');
                }
            });
        }
    }

    scrollToFirstInvalidControl() {
        const firstInvalidControl: HTMLElement = document.querySelector('.ng-invalid[formControlName], .ng-invalid[formGroupName]') as HTMLElement;
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
                { id: 1, name: '(1)/(2)/(3)' },
                { id: 2, name: '(4)/(5)/(6)' },
                { id: 4, name: '7' },
                { id: 8, name: '(A)/(C)/(E)' },
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
        },
        {
            category: 'Ferry',
            icon: 'bi-water',
            options: [
                { id: 131072, name: 'NYC Ferry' },
                { id: 262144, name: 'Staten Island Ferry' }
            ]
        },
        {
            category: 'Bike & Micromobility',
            icon: 'bi-bicycle',
            options: [
                { id: 524288, name: 'Citi Bike Nearby' },
                { id: 1048576, name: 'Protected Bike Lanes' },
                { id: 2097152, name: 'Scooter Friendly Area' }
            ]
        },
        {
            category: 'Car Access',
            icon: 'bi-car-front',
            options: [
                { id: 4194304, name: 'Easy Highway Access' },
                { id: 8388608, name: 'Street Parking Available' },
                { id: 16777216, name: 'Garage Parking Nearby' }
            ]
        }
    ];
}
