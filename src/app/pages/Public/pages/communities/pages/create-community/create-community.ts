import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { CreateCommunityService } from '../../services/createcommunty';
import { COMMUNITY_TYPES_LIST, LocationSearchResult } from '../../models/createcommunty';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';

@Component({
  selector: 'app-create-community',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CommunityDepartmentHeroComponent],
  templateUrl: './create-community.html',
  styleUrls: ['./create-community.scss']
})
export class CreateCommunityComponent implements OnInit {

  private fb = inject(FormBuilder);
  private communityService = inject(CreateCommunityService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Data
  typesList = COMMUNITY_TYPES_LIST;
  isSubmitting = false;
  errorSummary: string | null = null;
  divisionTags: string[] = [
    'Community',
    'Culture',
    'Education',
    'Health',
    'Housing',
    'Lifestyle',
    'Legal',
    'News',
    'Professions',
    'Social',
    'Transportation',
    'TV',
    'Events'
  ];
  selectedDivisionTag = 'Culture';
  communityCategories: string[] = [
    'Geographic Communities',
    'Government & Civic Communities',
    'Public & Social Service Communities',
    'Economic & Professional Communities',
    'Social & Relationship Communities'
  ];
  selectedCommunityCategory = this.communityCategories[0];

  // Files
  avatarFile: File | null = null;
  coverFile: File | null = null;
  avatarPreview: string | null = null;
  coverPreview: string | null = null;

  // Location Search Logic
  locationSearchControl = new FormControl('');
  locationResults: LocationSearchResult[] = [];
  selectedLocation: LocationSearchResult | null = null;
  isSearchingLocation = false;
  showLocationResults = false;

  // Form
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    type: [1, Validators.required],
    locationId: [null], // Stores the ID
    isPrivate: [false], // ✅ New Field: Default is Public (false)
    divisionTag: [this.selectedDivisionTag],
    communityCategory: [this.selectedCommunityCategory]
  });

  get inviteLink(): string {
    const slug = (this.form.get('slug')?.value || '').trim();
    return slug ? `nyc360.com/join/${slug}` : 'nyc360.com/join/your-community';
  }

  ngOnInit() {
    // Setup Location Search with Debounce
    this.locationSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => (term || '').length >= 2), // Search only if 2+ chars
      switchMap(term => {
        this.isSearchingLocation = true;
        this.showLocationResults = true;
        return this.communityService.searchLocations(term || '');
      })
    ).subscribe({
      next: (res) => {
        this.isSearchingLocation = false;
        if (res.isSuccess) {
          this.locationResults = res.data || [];
        } else {
          this.locationResults = [];
        }
      },
      error: () => {
        this.isSearchingLocation = false;
        this.locationResults = [];
      }
    });
  }

  // --- Actions ---

  onLocationSelect(loc: LocationSearchResult) {
    this.selectedLocation = loc;
    this.form.get('locationId')?.setValue(loc.id);
    this.locationSearchControl.setValue(`${loc.borough}, ${loc.neighborhood} (${loc.zipCode})`, { emitEvent: false });
    this.showLocationResults = false;
  }

  // Hide results when clicking outside (handled simply by delay for now or overlay)
  onSearchBlur() {
    setTimeout(() => this.showLocationResults = false, 200);
  }

  // Auto-generate slug
  onNameChange() {
    const name = this.form.get('name')?.value;
    if (name) {
      // Improved slug: lowercase, trim, replace spaces with hyphens, remove all non-alphanumeric (except hyphens)
      const slug = name.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      this.form.get('slug')?.setValue(slug);
    }
  }

  onDivisionTagSelect(tag: string) {
    this.selectedDivisionTag = tag;
    this.form.get('divisionTag')?.setValue(tag);
  }

  onCommunityCategorySelect(category: string) {
    this.selectedCommunityCategory = category;
    this.form.get('communityCategory')?.setValue(category);
  }

  onTypeSelect(typeId: number) {
    this.form.get('type')?.setValue(typeId);
  }

  getDivisionTagClass(tag: string): string {
    return `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`;
  }

  // File Handlers
  onAvatarSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  onCoverSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverFile = file;
      const reader = new FileReader();
      reader.onload = e => this.coverPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  copyInviteLink() {
    const link = this.inviteLink;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => this.toastService.success('Invite link copied.'))
        .catch(() => this.toastService.error('Could not copy invite link.'));
      return;
    }
    this.toastService.error('Clipboard is not available in this browser.');
  }

  submit() {
    if (this.form.invalid) {
      this.errorSummary = 'Please fix the errors highlighted above.';
      this.form.markAllAsTouched();

      // Detailed feedback
      if (!this.selectedLocation && this.locationSearchControl.value) {
        this.toastService.error('Please select a valid location from the list.');
      } else {
        this.toastService.error('Please fix the errors in the form before submitting.');
      }
      return;
    }

    this.errorSummary = null;
    this.isSubmitting = true;

    const formData = this.form.value;

    this.communityService.createCommunity(formData, this.avatarFile || undefined, this.coverFile || undefined)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.isSuccess) {
            this.toastService.success('Community created successfully!');
            this.router.navigate(['/public/community']);
          } else {
            this.toastService.error('Error: ' + (res.error?.message || 'Something went wrong'));
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastService.error('Failed to connect to server.');
        }
      });
  }
}
