import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunityService, LocationDto } from '../../services/community';
import { CommunitySuggestion } from '../../models/community';
import { environment } from '../../../../../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';
import { CommunityDepartmentHeroComponent } from '../../../../Widgets/community-department-hero/community-department-hero.component';

@Component({
  selector: 'app-community-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CommunityDepartmentHeroComponent],
  templateUrl: './community-discovery.html',
  styleUrls: ['./community-discovery.scss']
})
export class CommunityDiscoveryComponent implements OnInit {

  private communityService = inject(CommunityService);
  protected readonly environment = environment;
  private loaderService = inject(GlobalLoaderService);
  private route = inject(ActivatedRoute);

  // Data
  communities: (CommunitySuggestion & { showSuccess?: boolean })[] = [];

  // State
  searchText: string = '';
  selectedType: number | null = null;
  selectedLocationId: number | null = null;

  // Location Search State
  locationSearchText: string = '';
  locationSuggestions: LocationDto[] = [];
  showLocationDropdown = false;
  private locationSearchSubject = new Subject<string>();

  // Pagination
  currentPage: number = 1;
  pageSize: number = 6;
  totalCount: number = 0;
  totalPages: number = 1;

  isLoading = false;

  communityTypes = [
    { id: 1, name: 'District' },
    { id: 2, name: 'Neighborhood' },
    { id: 3, name: 'Local Service' },
    { id: 4, name: 'Housing Help' },
    { id: 5, name: 'Public Resources' },
    { id: 6, name: 'Civic Notices' },
    { id: 7, name: 'Safety Alerts' },
    { id: 8, name: 'Community Boards' },
    { id: 9, name: 'Youth Resources' },
    { id: 10, name: 'Senior Resources' },
    { id: 11, name: 'Family Support' },
    { id: 12, name: 'Accessibility' }
  ];

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const searchFromUrl = (params.get('search') || '').trim();
      const hasChanged = searchFromUrl !== this.searchText;
      this.searchText = searchFromUrl;
      if (hasChanged) {
        this.currentPage = 1;
      }
      this.loadCommunities();
    });

    this.setupLocationSearch();
  }

  setupLocationSearch() {
    this.locationSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.locationSuggestions = [];
          return [];
        }
        return this.communityService.searchLocations(query);
      })
    ).subscribe(res => {
      if (res.isSuccess) {
        this.locationSuggestions = res.data || [];
        this.showLocationDropdown = this.locationSuggestions.length > 0;
      }
    });
  }

  loadCommunities() {
    this.isLoading = true;
    this.loaderService.show();

    const typeParam = this.selectedType ? this.selectedType : undefined;
    const locParam = this.selectedLocationId ? this.selectedLocationId : undefined;

    this.communityService.discoverCommunities(
      this.currentPage,
      this.pageSize,
      this.searchText,
      typeParam,
      locParam
    ).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.loaderService.hide();
        if (res.isSuccess) {
          this.communities = res.data || [];
          this.totalCount = res.totalCount || 0;
          this.totalPages = (res.totalPages && res.totalPages > 0) ? res.totalPages : 1;
        }
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
        this.communities = [];
        this.totalPages = 1;
      }
    });
  }

  // --- Actions ---

  onSearch() {
    this.currentPage = 1;
    this.loadCommunities();
  }

  onTypeChange() {
    this.currentPage = 1;
    this.loadCommunities();
  }

  onLocationInput(text: string) {
    this.locationSearchText = text;
    this.locationSearchSubject.next(text);
    if (!text) {
      this.selectedLocationId = null;
      this.showLocationDropdown = false;
      this.currentPage = 1;
      this.loadCommunities();
    }
  }

  selectLocation(loc: LocationDto) {
    this.selectedLocationId = loc.id;
    this.locationSearchText = `${loc.neighborhood}, ${loc.borough}`;
    this.showLocationDropdown = false;
    this.currentPage = 1;
    this.loadCommunities();
  }

  clearLocation() {
    this.selectedLocationId = null;
    this.locationSearchText = '';
    this.locationSuggestions = [];
    this.showLocationDropdown = false;
    this.currentPage = 1;
    this.loadCommunities();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCommunities();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private toastService = inject(ToastService);

  joinCommunity(comm: CommunitySuggestion & { showSuccess?: boolean }) {
    if (comm.isJoined) return;

    comm.isLoadingJoin = true;
    this.communityService.joinCommunity(comm.id).subscribe({
      next: (res) => {
        comm.isLoadingJoin = false;
        if (res.isSuccess) {
          comm.isJoined = true;
          comm.memberCount++;
          this.toastService.success('Successfully joined the community!');

          // Show success message temporarily
          comm.showSuccess = true;
          setTimeout(() => {
            comm.showSuccess = false;
          }, 3000);
        } else {
          this.toastService.error((res as any).message || 'Failed to join community.');
        }
      },
      error: () => {
        comm.isLoadingJoin = false;
        this.toastService.error('An error occurred while joining.');
      }
    });
  }

  resolveAvatar(url?: string): string {
    if (!url) return 'assets/images/default-group.png';
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/communities/${url}`;
  }

  getTypeName(typeId: number): string {
    const type = this.communityTypes.find(t => t.id === typeId);
    return type ? type.name : 'Community';
  }
}
