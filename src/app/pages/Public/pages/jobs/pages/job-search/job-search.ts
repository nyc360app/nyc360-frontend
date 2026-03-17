import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobOfferSummary, JobSearchFilters, LocationSearchResult } from '../../models/job-search';
import { JobSearchService } from '../../service/job-search';
import { environment } from '../../../../../../environments/environment';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './job-search.html',
  styleUrls: ['./job-search.scss']
})
export class JobSearchComponent implements OnInit {
  private jobService = inject(JobSearchService);
  private cdr = inject(ChangeDetectorRef); // Inject CDR
  private loaderService = inject(GlobalLoaderService);

  jobs: JobOfferSummary[] = [];
  locations: LocationSearchResult[] = [];
  locationQuery = '';
  isLoading = false;
  errorMsg = '';

  filters: JobSearchFilters = {
    Search: '',
    LocationId: null,
    Arrangement: null,
    Type: null,
    Level: null,
    MinSalary: null,
    IsActive: true,
    Page: 1,
    PageSize: 12
  };

  pagination = { totalPages: 1, currentPage: 1 };

  ngOnInit(): void {
    this.fetchJobs();
  }

  onSearchSubmit(): void {
    if (this.filters.Search && this.filters.Search.trim().length < 2) {
      alert('Search term must be at least 2 characters.');
      return;
    }
    this.filters.Page = 1;
    this.fetchJobs();
  }

  fetchJobs(): void {
    this.isLoading = true;
    this.loaderService.show();
    this.errorMsg = '';

    this.jobService.searchJobs(this.filters).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.jobs = res.data;
          this.pagination.totalPages = res.totalPages;
          this.pagination.currentPage = res.page;
        } else {
          this.errorMsg = 'Failed to load jobs.';
        }
        this.isLoading = false;
        this.loaderService.hide();
        this.cdr.detectChanges(); // Force update
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
        this.errorMsg = 'Server error occurred.';
        this.cdr.detectChanges(); // Force update
      }
    });
  }

  onLocInput(): void {
    if (this.locationQuery.length >= 3) {
      this.jobService.searchLocations(this.locationQuery).subscribe(res => {
        this.locations = res.data || [];
        this.cdr.detectChanges(); // Force update
      });
    } else {
      this.locations = [];
      this.filters.LocationId = null;
      this.cdr.detectChanges(); // Force update
    }
  }

  selectLoc(loc: LocationSearchResult): void {
    this.filters.LocationId = loc.id;
    this.locationQuery = `${loc.neighborhood}, ${loc.borough}`;
    this.locations = [];
    this.fetchJobs();
  }

  changePage(p: number): void {
    if (p >= 1 && p <= this.pagination.totalPages) {
      this.filters.Page = p;
      this.fetchJobs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getArrangement(v: number) { return ['On-Site', 'Remote', 'Hybrid'][v] || 'On-Site'; }
  getType(v: number) { return ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Freelance'][v] || 'Full-Time'; }
  getLevel(v: number) { return ['N/A', 'Junior', 'Mid', 'Senior-Mid', 'Senior'][v] || 'N/A'; }

  resolveJobImage(url: string | undefined): string {
    if (!url) return 'assets/images/placeholder-job.jpg';
    if (url.startsWith('http')) return url;
    return `${environment.apiBaseUrl2}/avatars/${url}`;
  }
}