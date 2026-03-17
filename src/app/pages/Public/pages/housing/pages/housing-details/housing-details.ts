import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HousingViewService } from '../../service/housing-view.service';
import { ImageService } from '../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../shared/directives/img-fallback.directive';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { AuthService } from '../../../../../Authentication/Service/auth';

import { AgentRequestComponent } from '../agent-request/agent-request.component';

import { HousingRequestStatusComponent } from '../request-status/request-status.component';

@Component({
    selector: 'app-housing-details',
    standalone: true,
    imports: [CommonModule, RouterModule, AgentRequestComponent, HousingRequestStatusComponent, ImgFallbackDirective],
    templateUrl: './housing-details.html',
    styleUrls: ['./housing-details.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private housingService = inject(HousingViewService);
    private cdr = inject(ChangeDetectorRef);
    protected imageService = inject(ImageService);
    private router = inject(Router);
    private authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID);

    property: any = null;
    similarProperties: any[] = [];
    availabilities: any[] = [];
    isLoading = true;
    activeMedia: any = null;
    currentUserId: number | null = null;
    showAllPhotos = false;
    showAgentRequestModal = false;

    // Helper to determine media type
    public getMediaType(url: string): 'image' | 'video' | 'file' {
        if (!url) return 'image';
        const lower = url.toLowerCase();
        if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov')) {
            return 'video';
        }
        if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.txt')) {
            return 'file';
        }
        return 'image';
    }

    public isVideo(url: string): boolean {
        return this.getMediaType(url) === 'video';
    }

    ngOnInit(): void {
        this.currentUserId = this.authService.getUserId();
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadDetails(id);
            }
        });
    }

    get canEdit(): boolean {
        return !!this.property && !!this.currentUserId && this.property.author?.id === this.currentUserId;
    }

    loadDetails(id: string) {
        this.isLoading = true;
        this.cdr.markForCheck();

        if (isPlatformBrowser(this.platformId)) {
            window.scrollTo(0, 0);
        }

        this.housingService.getHousingDetails(id).subscribe({
            next: (res: any) => {
                console.log('[HousingDetails] API Response:', res);
                if (res.isSuccess) {
                    const data = res.data.info;

                    // Process Attachments
                    const rawAttachments = data.attachments || [];
                    const processedAttachments = rawAttachments.map((att: any) => {
                        const rawUrl = typeof att === 'string' ? att : att.url;
                        const id = typeof att === 'string' ? 0 : att.id;
                        // Use imageService to resolve the full URL (handling @local://)
                        // passing 'housing' or 'post' as category usually works similarly for resolving
                        const resolvedUrl = this.imageService.resolveImageUrl(rawUrl, 'housing');
                        return {
                            id: id,
                            url: resolvedUrl,
                            type: this.getMediaType(rawUrl),
                            originalUrl: rawUrl
                        };
                    });

                    // Map API fields
                    // Map API fields
                    // Map API fields
                    this.property = {
                        ...data,
                        title: data.title || (data.fullAddress ? data.fullAddress : `${data.bedrooms ?? 0} Bed ${data.bathrooms ?? 0} Bath in ${data.neighborhood || 'NYC'}`),
                        startingPrice: data.startingPrice ?? data.startingOrAskingPrice ?? data.monthlyCostRange,
                        numberOfRooms: data.numberOfRooms ?? data.bedrooms,
                        numberOfBathrooms: data.numberOfBathrooms ?? data.bathrooms,
                        moveInDate: data.moveInDate ?? data.moveInOrOpeningDate,
                        moveOutDate: data.moveOutDate,
                        maxOccupants: data.maxOccupants ?? data.maxOrSuggestedOccupants,
                        securityDeposit: data.securityDeposit ?? data.securityDepositOrDownPayment,
                        yearBuilt: data.yearBuilt ?? data.builtIn,
                        size: data.size ?? data.sqft,
                        buildingType: data.buildingType ?? data.houseType,
                        heatingSystem: data.heatingSystem ?? data.heating,
                        coolingSystem: data.coolingSystem ?? data.cooling,
                        temperatureControl: data.temperatureControl ?? data.temperatureControl,
                        nearbySubwayLines: (data.nearbySubwayLines ?? data.nearbyTransportation)?.map((id: number) => {
                            const found = this.transportationOptions.find(o => o.id === id);
                            return found ? found.name : String(id);
                        }) || [],
                        acceptedHousingPrograms: data.acceptedHousingPrograms ?? data.rentHousingPrograms,
                        acceptedBuyerPrograms: data.acceptedBuyerPrograms ?? data.buyerHousingProgram,
                        googleMapLink: data.googleMapLink ?? data.googleMap,
                        laundryType: (data.laundryType !== undefined) ? data.laundryType : (Array.isArray(data.laundryTypes) ? data.laundryTypes[0] : (data.laundry || 0)),
                        address: data.address || {
                            buildingNumber: data.buildingNumber || '',
                            street: data.fullAddress || '',
                            unitNumber: data.unitNumber || '',
                            zipCode: data.zipCode || '',
                            location: {
                                neighborhood: data.neighborhood || '',
                                borough: data.borough || ''
                            }
                        },
                        // Additional Booleans
                        familyAndKidsFriendly: data.familyAndKidsFriendly,
                        shortStayEligible: data.shortStayEligible,
                        addDirectApplyLink: data.addDirectApplyLink,
                        isFurnished: data.furnished,
                        isPetsFriendly: data.petsFriendly,
                        isShortTermStayAllowed: data.shortTermStayAllowed,
                        isAcceptsHousingVouchers: data.acceptsHousingVouchers,
                        accessibilityFriendly: data.accessibilityFriendly,
                        smokingAllowed: data.smokingAllowed,

                        utilitiesIncluded: (data.utilitiesIncluded ?? data.amenities)?.map((id: number) => {
                            return this.getLabel(id, this.amenitiesOptions) || `Amenity ${id}`;
                        }) || [],
                        // New Fields
                        coListers: data.coListers, // Can be array or null
                        rentingLeaseType: data.rentingLeaseType,
                        rentPrivacyType: data.rentPrivacyType,
                        rentBathroomType: data.rentBathroomType,
                        rentKitchenType: data.rentKitchenType,
                        rentingAboutCurrentResident: data.rentingAboutCurrentResident,
                        rentingRulesAndPolicies: data.rentingRulesAndPolicies,
                        rentingRoommateGroupChat: data.rentingRoommateGroupChat,
                        // Media
                        attachments: processedAttachments,
                        images: processedAttachments.filter((a: any) => a.type === 'image'),
                        videos: processedAttachments.filter((a: any) => a.type === 'video'),
                        documents: processedAttachments.filter((a: any) => a.type === 'file')
                    };

                    this.availabilities = res.data.availabilities || [];
                    this.requestInfo = res.data.request;
                    this.similarProperties = (res.data.similar || []).map((p: any) => {
                        const rawMedia = p.imageUrl || (p.attachments?.[0]?.url || p.attachments?.[0]);
                        return {
                            ...p,
                            mediaUrl: this.imageService.resolveImageUrl(rawMedia, 'housing'),
                            mediaType: this.getMediaType(String(rawMedia || ''))
                        };
                    });

                    // Set Initial Active Media
                    // Prefer Image, then Video
                    if (this.property.images.length > 0) {
                        this.activeMedia = this.property.images[0];
                    } else if (this.property.videos.length > 0) {
                        this.activeMedia = this.property.videos[0];
                    } else if (this.property.imageUrl) {
                        // Fallback property image
                        this.activeMedia = {
                            url: this.imageService.resolveImageUrl(this.property.imageUrl, 'housing'),
                            type: 'image'
                        };
                    } else if (processedAttachments.length > 0) {
                        this.activeMedia = processedAttachments[0];
                    }
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading details:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    setActiveMedia(media: any) {
        this.activeMedia = media;
    }

    togglePhotos() {
        this.openLightbox(0);
    }

    // --- Enums & Options (Mapped from Create/Edit) ---
    buildingTypeOptions = [
        { id: 0, name: 'Walk-up', icon: 'bi-building' },
        { id: 1, name: 'Elevator', icon: 'bi-building-up' },
        { id: 2, name: 'Townhouse', icon: 'bi-house-heart' },
        { id: 3, name: 'Detached', icon: 'bi-house' }
    ];

    householdTypes = [
        { id: 0, name: 'Individual' },
        { id: 1, name: 'Couple' },
        { id: 2, name: 'Single Family' },
        { id: 3, name: 'Multi Family' }
    ];

    contactTypes = [
        { id: 0, name: 'Email' },
        { id: 1, name: 'Phone' },
        { id: 2, name: 'Text' }
    ];

    heatingSystems = [
        { id: 0, name: 'Steam Radiator' },
        { id: 1, name: 'Hot Water Central' },
        { id: 2, name: 'Electric Baseboard' },
        { id: 3, name: 'Forced Air' },
        { id: 4, name: 'Heat Pump' },
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
        { id: 1, name: 'Building Shared Control' },
        { id: 2, name: 'Smart Thermostat' }
    ];

    laundryTypes = [
        { id: 0, name: 'In-Unit' },
        { id: 1, name: 'In-Building' },
        { id: 2, name: 'Nearby' }
    ];

    transportationOptions = [
        { id: 1, name: '1 2 3' },
        { id: 2, name: '4 5 6' },
        { id: 4, name: '7' },
        { id: 8, name: 'A C E' },
        { id: 16, name: 'B D F M' },
        { id: 32, name: 'G' },
        { id: 64, name: 'J Z' },
        { id: 128, name: 'L' },
        { id: 256, name: 'N Q R W' },
        { id: 512, name: 'S' }
    ];

    leaseTypes = [
        { id: 0, name: 'Lease' },
        { id: 1, name: 'Sub-lease' },
        { id: 2, name: 'Short-term' },
        { id: 3, name: 'Month-to-month' },
        { id: 4, name: 'Flexible' }
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

    buyerPrograms = [
        { id: 0, name: 'Mortgage Financing Accepted' },
        { id: 1, name: 'Conventional Loan' },
        { id: 2, name: 'FHA Loan' },
        { id: 3, name: 'VA Loan' },
        { id: 4, name: 'SONYMA Loan' },
        { id: 5, name: 'Co-op Board Approval' },
        { id: 6, name: 'First-Time Buyer' },
        { id: 7, name: 'Buyer Assistance' },
        { id: 8, name: 'Other Assistance Programs' },
        { id: 9, name: 'Cash-Only' }
    ];

    amenitiesOptions = [
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

    getLabel(value: number, options: any[]): string {
        const item = options.find(o => o.id === value);
        return item ? item.name : 'Not Specified';
    }

    getProgramLabels(values: number[], programs: any[]): string[] {
        if (!values || values.length === 0) return [];
        return values.map(v => this.getLabel(v, programs)).filter(l => l !== 'Not Specified');
    }

    formatPrice(price: number): string {
        if (price === undefined || price === null || price === 0) return 'Contact for Price';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    hasFeatures(): boolean {
        // Updated to be always true or just check if property loaded because we will show "Not specified" if false
        return !!this.property;
    }

    openAgentRequest() {
        if (!this.currentUserId) {
            this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
            return;
        }
        this.showAgentRequestModal = true;
        this.cdr.markForCheck();
    }

    closeAgentRequest() {
        this.showAgentRequestModal = false;
        this.cdr.markForCheck();
    }

    handleRequestSubmitted() {
        if (isPlatformBrowser(this.platformId)) {
            window.location.reload();
        }
    }

    requestInfo: any = null;
    showRequestInfoModal = false;

    openRequestInfo() {
        this.showRequestInfoModal = true;
        this.cdr.markForCheck();
    }

    closeRequestInfo() {
        this.showRequestInfoModal = false;
        this.cdr.markForCheck();
    }

    handleStatusUpdated(newStatus: number) {
        if (this.requestInfo) {
            this.requestInfo.status = newStatus;
            this.cdr.markForCheck();
        }
    }
    // --- Lightbox & Zoom Logic ---
    lightboxActive = false;
    lightboxIndex = 0;

    // Zoom Variables
    showZoom = false;
    zoomStyle: any = {
        'background-image': '',
        'background-position': '0% 0%',
        'display': 'none'
    };
    lensStyle: any = {
        'left.px': 0,
        'top.px': 0,
        'display': 'none'
    };

    openLightbox(index: number = 0) {
        this.lightboxIndex = index;
        this.lightboxActive = true;

        // Disable scroll
        if (isPlatformBrowser(this.platformId)) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeLightbox() {
        this.lightboxActive = false;
        if (isPlatformBrowser(this.platformId)) {
            document.body.style.overflow = '';
        }
    }

    nextImage(e?: Event) {
        e?.stopPropagation();
        if (!this.property?.attachments) return;
        const total = this.property.attachments.length;
        this.lightboxIndex = (this.lightboxIndex + 1) % total;
    }

    prevImage(e?: Event) {
        e?.stopPropagation();
        if (!this.property?.attachments) return;
        const total = this.property.attachments.length;
        this.lightboxIndex = (this.lightboxIndex - 1 + total) % total;
    }

    getActiveLightboxMedia() {
        if (!this.property?.attachments?.length) return null;
        return this.property.attachments[this.lightboxIndex];
    }

    // Zoom Lens Logic
    onMouseEnter() {
        if (this.activeMedia?.type === 'image') {
            this.showZoom = true;
            this.zoomStyle.display = 'block';
            this.lensStyle.display = 'block';
            this.zoomStyle['background-image'] = `url(${this.activeMedia.url})`;
        }
    }

    onMouseLeave() {
        this.showZoom = false;
        this.zoomStyle.display = 'none';
        this.lensStyle.display = 'none';
    }

    onMouseMove(event: MouseEvent) {
        if (!this.showZoom) return;

        const imageContainer = event.currentTarget as HTMLElement;
        const rect = imageContainer.getBoundingClientRect();

        // Coordinates relative to the image container
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        // Lens dimensions (should match CSS)
        const lensWidth = 100;
        const lensHeight = 100;

        // Constraint check
        if (x > rect.width) x = rect.width;
        if (x < 0) x = 0;
        if (y > rect.height) y = rect.height;
        if (y < 0) y = 0;

        // Center the lens on the cursor
        let lensX = x - (lensWidth / 2);
        let lensY = y - (lensHeight / 2);

        // Prevent lens from going out of bounds
        if (lensX > rect.width - lensWidth) lensX = rect.width - lensWidth;
        if (lensX < 0) lensX = 0;
        if (lensY > rect.height - lensHeight) lensY = rect.height - lensHeight;
        if (lensY < 0) lensY = 0;

        this.lensStyle['left.px'] = lensX;
        this.lensStyle['top.px'] = lensY;

        // Calculate background zoom
        const scale = 2.5;
        this.zoomStyle['background-size'] = `${rect.width * scale}px ${rect.height * scale}px`;
        this.zoomStyle['background-position'] = `-${lensX * scale}px -${lensY * scale}px`;
    }
}
