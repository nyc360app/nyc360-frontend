import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ProfileService } from '../profile/service/profile';
import { AuthService } from '../../../Authentication/Service/auth';
import { VerificationService } from './services/verification.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import {
    UserProfileData, UpdateBasicProfileDto, AddEducationDto, UpdateEducationDto,
    AddPositionDto, UpdatePositionDto, Education, Position, SocialPlatform, SocialLinkDto, UserSocialLink
} from '../profile/models/profile';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { filterPublicCommunityBadges } from '../../../../shared/utils/community-badge-policy';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [DatePipe],
    templateUrl: './settings.html',
    styleUrls: ['./settings.scss']
})
export class SettingsComponent implements OnInit {

    private profileService = inject(ProfileService);
    private authService = inject(AuthService);
    private verificationService = inject(VerificationService);
    private toastService = inject(ToastService);
    private confirmationService = inject(ConfirmationService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private datePipe = inject(DatePipe);

    // Layout State
    activeTab: 'profile' | 'security' | 'tags' | 'verification' = 'profile';

    // Data State
    user: UserProfileData | null = null;
    isLoading = true;
    isSaving = false;

    // Forms
    basicForm!: FormGroup;
    eduForm!: FormGroup;
    posForm!: FormGroup;
    socialForm!: FormGroup;
    passwordForm!: FormGroup;
    verificationForm!: FormGroup;

    // Tag Search
    tagSearchControl = new FormControl('');
    tagSearchResults: any[] = [];
    showTagDropdown = false;
    selectedTag: any = null;
    private tagSearch$ = new Subject<string>();

    // Edit State
    isEditMode = false;
    selectedItemId: number | null = null;
    selectedVerificationFile: File | null = null;

    modalState = { education: false, position: false, social: false, password: false };

    // Success Overlay State
    showSuccessOverlay = false;
    successMessage = '';

    socialPlatforms = [
        { id: SocialPlatform.Facebook, name: 'Facebook', icon: 'bi-facebook' },
        { id: SocialPlatform.Twitter, name: 'Twitter', icon: 'bi-twitter-x' },
        { id: SocialPlatform.LinkedIn, name: 'LinkedIn', icon: 'bi-linkedin' },
        { id: SocialPlatform.Github, name: 'Github', icon: 'bi-github' },
        { id: SocialPlatform.Website, name: 'Website', icon: 'bi-globe' },
        { id: SocialPlatform.Other, name: 'Other', icon: 'bi-link-45deg' }
    ];

    documentTypes = [
        { id: 1, name: 'Government ID' },
        { id: 2, name: 'Utility Bill' },
        { id: 3, name: 'Organization Charter' },
        { id: 4, name: 'Business License' },
        { id: 5, name: 'Professional License' },
        { id: 6, name: 'Employee ID Card' },
        { id: 7, name: 'Academic Degree' },
        { id: 8, name: 'Certification' },
        { id: 9, name: 'Portfolio Link (PDF/Image)' },
        { id: 10, name: 'Press Credential' },
        { id: 11, name: 'Contract Agreement' },
        { id: 12, name: 'Letter of Recommendation' },
        { id: 99, name: 'Other' }
    ];

    ngOnInit() {
        this.initForms();
        this.loadCurrentUser();
        this.setupTagSearch();
    }

    initForms() {
        // ... (existing form inits)
        this.basicForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            headline: ['', [Validators.required, Validators.maxLength(100)]],
            bio: ['', [Validators.maxLength(500)]],
            locationId: [0]
        });

        this.eduForm = this.fb.group({
            school: ['', Validators.required],
            degree: ['', Validators.required],
            fieldOfStudy: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['']
        });

        this.posForm = this.fb.group({
            title: ['', Validators.required],
            company: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: [''],
            isCurrent: [false]
        });

        this.socialForm = this.fb.group({
            platform: [SocialPlatform.Website, Validators.required],
            url: ['', [Validators.required, Validators.pattern('https?://.+')]]
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });

        this.verificationForm = this.fb.group({
            tagId: [0, Validators.required], // Hidden or managed by UI
            reason: ['', [Validators.required, Validators.minLength(10)]],
            documentType: [1, Validators.required],
            file: [null, Validators.required]
        });
    }

    setupTagSearch() {
        this.tagSearchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.length < 2) return of([]);
                return this.verificationService.searchTags(term).pipe(
                    catchError(() => of([]))
                );
            })
        ).subscribe((res: any) => {
            this.tagSearchResults = filterPublicCommunityBadges(res.data || [])
                .map((tag: any) => ({
                    ...tag,
                    id: tag?.id ?? tag?.Id,
                    name: tag?.name ?? tag?.Name
                }))
                .filter((tag: any) => !!tag.id && !!tag.name);
            this.showTagDropdown = this.tagSearchResults.length > 0;
            this.cdr.detectChanges();
        });
    }

    selectTag(tag: any) {
        this.selectedTag = tag;
        this.verificationForm.patchValue({ tagId: tag.id });
        this.tagSearchControl.setValue(tag.name, { emitEvent: false }); // Show name in input
        this.showTagDropdown = false;
    }

    clearTagSelection() {
        this.selectedTag = null;
        this.verificationForm.patchValue({ tagId: 0 });
        this.tagSearchControl.setValue('');
    }

    // ... (existing methods loadCurrentUser, saveBasicInfo, etc.)
    // ... (Education, Position, Social methods)

    // --- Security ---
    openChangePassword() {
        this.passwordForm.reset();
        this.modalState.password = true;
    }

    savePassword() {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const val = this.passwordForm.value;
        if (val.newPassword !== val.confirmPassword) {
            this.toastService.error('New passwords do not match!');
            return;
        }

        this.isSaving = true;
        // Simulate API call
        setTimeout(() => {
            this.isSaving = false;
            this.modalState.password = false;
            this.triggerSuccessOverlay('Password changed successfully!');
        }, 1000);
    }

    // --- Helpers ---
    handleResponse(res: any, modalKey: keyof typeof this.modalState) {
        this.isSaving = false;
        if (res.isSuccess) {
            this.modalState[modalKey] = false;
            this.loadCurrentUser();
            this.triggerSuccessOverlay('Operation completed successfully!');
        } else {
            this.toastService.error(res.error?.message || 'Update failed');
        }
    }

    triggerSuccessOverlay(message: string) {
        this.successMessage = message;
        this.showSuccessOverlay = true;
        setTimeout(() => {
            this.showSuccessOverlay = false;
            this.cdr.detectChanges();
        }, 2200); // Overlay duration
    }

    closeModals() {
        Object.keys(this.modalState).forEach(key => this.modalState[key as keyof typeof this.modalState] = false);
    }

    loadCurrentUser() {
        this.isLoading = true;
        const currentUser = this.authService.currentUser$.value;
        if (!currentUser || !currentUser.username) {
            this.isLoading = false;
            return;
        }

        this.profileService.getProfile(currentUser.username).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess && res.data) {
                    this.user = res.data;
                    // Pre-fill basic form
                    this.basicForm.patchValue({
                        firstName: this.user.firstName,
                        lastName: this.user.lastName,
                        headline: this.user.headline,
                        bio: this.user.bio,
                        locationId: this.user.locationId || 1
                    });
                }
                this.cdr.detectChanges();
            },
            error: () => this.isLoading = false
        });
    }

    // --- Basic Info ---
    saveBasicInfo() {
        if (this.basicForm.invalid) {
            this.basicForm.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const dto: UpdateBasicProfileDto = {
            FirstName: this.basicForm.value.firstName,
            LastName: this.basicForm.value.lastName,
            Headline: this.basicForm.value.headline,
            Bio: this.basicForm.value.bio,
            LocationId: Number(this.basicForm.value.locationId)
        };

        this.profileService.updateBasicInfo(dto).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.isSuccess) {
                    this.triggerSuccessOverlay('Profile updated successfully!');
                    this.loadCurrentUser();
                } else {
                    this.toastService.error('Update failed');
                }
            },
            error: () => this.isSaving = false
        });
    }

    // --- Education ---
    openAddEdu() { this.isEditMode = false; this.eduForm.reset(); this.modalState.education = true; }

    openEditEdu(edu: Education) {
        this.isEditMode = true;
        this.selectedItemId = edu.id;
        this.eduForm.patchValue({
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: this.formatDateForInput(edu.startDate),
            endDate: this.formatDateForInput(edu.endDate)
        });
        this.modalState.education = true;
    }

    saveEdu() {
        if (this.eduForm.invalid) return;
        this.isSaving = true;
        const val = this.eduForm.value;
        const dtoAdd: AddEducationDto = {
            School: val.school,
            Degree: val.degree,
            FieldOfStudy: val.fieldOfStudy,
            StartDate: new Date(val.startDate).toISOString(),
            EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined
        };

        const dtoUpdate: UpdateEducationDto = { EducationId: this.selectedItemId!, ...dtoAdd };

        if (this.isEditMode) {
            this.profileService.updateEducation(dtoUpdate).subscribe(res => this.handleResponse(res, 'education'));
        } else {
            this.profileService.addEducation(dtoAdd).subscribe(res => this.handleResponse(res, 'education'));
        }
    }

    deleteEdu(id: number) {
        this.confirmationService.confirm({
            title: 'Delete Education',
            message: 'Are you sure you want to delete this education entry?',
            confirmText: 'Delete',
            type: 'danger'
        }).then((confirmed) => {
            if (confirmed) {
                this.profileService.deleteEducation(id).subscribe(() => { this.loadCurrentUser(); this.toastService.success('Deleted successfully'); });
            }
        });
    }

    // --- Position ---
    openAddPos() { this.isEditMode = false; this.posForm.reset({ isCurrent: false }); this.modalState.position = true; }

    openEditPos(pos: Position) {
        this.isEditMode = true;
        this.selectedItemId = pos.id;
        this.posForm.patchValue({
            title: pos.title,
            company: pos.company,
            startDate: this.formatDateForInput(pos.startDate),
            endDate: this.formatDateForInput(pos.endDate),
            isCurrent: pos.isCurrent
        });
        this.modalState.position = true;
    }

    savePos() {
        if (this.posForm.invalid) return;
        this.isSaving = true;
        const val = this.posForm.value;
        const dtoAdd: AddPositionDto = {
            Title: val.title,
            Company: val.company,
            StartDate: new Date(val.startDate).toISOString(),
            EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined,
            IsCurrent: val.isCurrent
        };

        const dtoUpdate: UpdatePositionDto = { PositionId: this.selectedItemId!, ...dtoAdd };

        if (this.isEditMode) {
            this.profileService.updatePosition(dtoUpdate).subscribe(res => this.handleResponse(res, 'position'));
        } else {
            this.profileService.addPosition(dtoAdd).subscribe(res => this.handleResponse(res, 'position'));
        }
    }

    deletePos(id: number) {
        this.confirmationService.confirm({
            title: 'Delete Experience',
            message: 'Are you sure you want to delete this experience entry?',
            confirmText: 'Delete',
            type: 'danger'
        }).then((confirmed) => {
            if (confirmed) {
                this.profileService.deletePosition(id).subscribe(() => { this.loadCurrentUser(); this.toastService.success('Deleted successfully'); });
            }
        });
    }

    // --- Social ---
    openAddSocial() { this.isEditMode = false; this.socialForm.reset({ platform: SocialPlatform.Website }); this.modalState.social = true; }

    openEditSocial(link: UserSocialLink) {
        this.isEditMode = true;
        this.selectedItemId = link.id || link.linkId || null;
        this.socialForm.patchValue({
            platform: link.platform,
            url: link.url
        });
        this.modalState.social = true;
    }

    saveSocial() {
        if (this.socialForm.invalid) {
            this.socialForm.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const dto: SocialLinkDto = {
            LinkId: this.isEditMode ? this.selectedItemId! : 0,
            Platform: Number(this.socialForm.value.platform),
            Url: this.socialForm.value.url
        };

        if (this.isEditMode) {
            this.profileService.updateSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
        } else {
            this.profileService.addSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
        }
    }

    deleteSocial(id: number) {
        this.confirmationService.confirm({
            title: 'Delete Social Link',
            message: 'Are you sure you want to delete this social link?',
            confirmText: 'Delete',
            type: 'danger'
        }).then((confirmed) => {
            if (confirmed) {
                this.profileService.deleteSocialLink(id).subscribe({
                    next: (res: any) => {
                        if (res.isSuccess) {
                            this.toastService.success('Social link deleted');
                            this.loadCurrentUser();
                        } else {
                            this.toastService.error(res.error?.message || 'Failed to delete social link');
                        }
                    },
                    error: () => this.toastService.error('Network error')
                });
            }
        });
    }


    formatDateForInput(dateStr?: string): string {
        return dateStr ? (this.datePipe.transform(dateStr, 'yyyy-MM-dd') || '') : '';
    }

    getPlatformName(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.name || 'Link'; }
    getPlatformIcon(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.icon || 'bi-link'; }

    onAvatarSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.profileService.uploadAvatar(file).subscribe(res => { if (res.isSuccess) { this.loadCurrentUser(); this.toastService.success('Avatar updated'); } });
    }

    onCoverSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.profileService.uploadCover(file).subscribe(res => { if (res.isSuccess) { this.loadCurrentUser(); this.toastService.success('Cover updated'); } });
    }

    saveSecurity() {
        this.toastService.success('Security settings saved (Simulation)');
    }

    saveTags() {
        this.toastService.success('Tags saved (Simulation)');
    }

    // --- Verifications ---
    verificationType: 'identity' | 'tag' = 'identity';

    setVerificationType(type: 'identity' | 'tag') {
        this.verificationType = type;
        this.verificationForm.reset({ tagId: 0, documentType: 1 });
        this.selectedVerificationFile = null;
        this.clearTagSelection();
    }

    onVerificationFileSelected(event: any) {
        if (event.target.files.length > 0) {
            this.selectedVerificationFile = event.target.files[0];
            this.verificationForm.patchValue({ file: this.selectedVerificationFile });
        }
    }

    submitVerification() {
        if (this.verificationForm.invalid) {
            this.verificationForm.markAllAsTouched();
            this.toastService.error('Please complete the verification form.');
            return;
        }

        if (this.verificationType === 'tag' && !this.selectedTag) {
            this.toastService.error('Please select a tag to verify.');
            return;
        }

        if (!this.selectedVerificationFile) {
            this.toastService.error('Please upload a document.');
            return;
        }

        this.isSaving = true;

        if (this.verificationType === 'identity') {
            const data = {
                Reason: this.verificationForm.value.reason,
                DocumentType: this.verificationForm.value.documentType,
                File: this.selectedVerificationFile
            };

            this.verificationService.submitIdentityVerification(data).subscribe({
                next: (res) => this.handleVerificationSuccess(res),
                error: () => this.handleVerificationError()
            });

        } else {
            const data = {
                TagId: this.verificationForm.value.tagId,
                Reason: this.verificationForm.value.reason,
                DocumentType: this.verificationForm.value.documentType,
                File: this.selectedVerificationFile
            };

            this.verificationService.submitVerification(data).subscribe({
                next: (res) => this.handleVerificationSuccess(res),
                error: () => this.handleVerificationError()
            });
        }
    }

    private handleVerificationSuccess(res: any) {
        this.isSaving = false;
        if (res.isSuccess) {
            this.triggerSuccessOverlay('Verification request submitted!');
            this.verificationForm.reset({ tagId: 0, documentType: 1 });
            this.selectedVerificationFile = null;
            this.clearTagSelection();
        } else {
            this.toastService.error(res.error?.message || 'Submission failed');
        }
    }

    private handleVerificationError() {
        this.isSaving = false;
        this.toastService.error('Network error. Please try again.');
    }

}
