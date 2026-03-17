import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services
import { JobProfileService } from '../../service/job-profile';

// Models & Env
import { JobProfile, RelatedJob, Applicant, ApplicationStatus } from '../../models/job-profile';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Authentication/Service/auth';

@Component({
  selector: 'app-job-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './job-profile.html',
  styleUrls: ['./job-profile.scss']
})
export class JobProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jobService = inject(JobProfileService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  job: JobProfile | null = null;
  relatedJobs: RelatedJob[] = [];
  applicants: Applicant[] = [];

  // UI States
  activeTab: string = 'overview';
  isLoading: boolean = true;
  isLoadingApplicants: boolean = false;
  imgBase = environment.apiBaseUrl2;

  // Author Logic
  currentUserId: number | null = null;
  isAuthor: boolean = false;

  // Apply Modal State
  showApplyModal: boolean = false;
  showSuccessModal: boolean = false;
  coverLetterText: string = '';
  selectedFile: File | undefined;
  isSubmittingApply: boolean = false;

  // ✅ Share Modal State
  showShareModal: boolean = false;
  isSharing: boolean = false;
  shareLink: string = '';

  // ✅ Status Options for Dropdown
  statusOptions = [
    { value: ApplicationStatus.Pending, label: 'Pending' },
    { value: ApplicationStatus.Reviewed, label: 'Reviewed' },
    { value: ApplicationStatus.Interviewing, label: 'Interviewing' },
    { value: ApplicationStatus.Rejected, label: 'Rejected' },
    { value: ApplicationStatus.Accepted, label: 'Accepted' }
  ];

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) { this.loadJobData(id); }
    });
  }

  loadJobData(id: string): void {
    this.isLoading = true;
    this.jobService.getJobProfile(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.job = res.data.offer;
          this.relatedJobs = res.data.relatedJobs || [];

          if (this.currentUserId && this.job.author.id === this.currentUserId) {
            this.isAuthor = true;
          } else {
            this.isAuthor = false;
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'applicants' && this.isAuthor && this.job) {
      this.loadApplicants();
    }
  }

  loadApplicants(): void {
    if (!this.job) return;
    this.isLoadingApplicants = true;
    this.jobService.getJobApplicants(this.job.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.applicants = res.data || [];
        }
        this.isLoadingApplicants = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingApplicants = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Update Application Status Logic
  onStatusChange(applicant: Applicant, newStatus: any): void {
    // newStatus يأتي من الـ select كـ string أحياناً لذا نحوله لـ number
    const statusValue = Number(newStatus);

    this.jobService.updateApplicationStatus(applicant.applicationId, statusValue).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          applicant.status = statusValue; // Update UI locally
          alert('Status updated successfully');
        } else {
          alert('Failed to update status');
        }
      },
      error: () => alert('Error updating status')
    });
  }

  // ✅ Share Logic
  openShareModal(): void {
    this.shareLink = window.location.href; // Generate current link
    this.showShareModal = true;
  }

  confirmShare(): void {
    if (!this.job) return;
    this.isSharing = true;

    this.jobService.shareOffer(this.job.id).subscribe({
      next: (res) => {
        this.isSharing = false;
        if (res.isSuccess) {
          this.showShareModal = false;
          alert('Job shared successfully!');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSharing = false;
        this.showShareModal = false; // Close anyway on mock error or specific logic
        this.cdr.detectChanges();
      }
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareLink);
    alert('Link copied to clipboard!');
  }

  // ✅ Applicant Expansion Logic
  expandedApplicantIds: Set<number> = new Set<number>();

  toggleApplicant(appId: number): void {
    if (this.expandedApplicantIds.has(appId)) {
      this.expandedApplicantIds.delete(appId);
    } else {
      this.expandedApplicantIds.add(appId);
    }
  }

  isApplicantExpanded(appId: number): boolean {
    return this.expandedApplicantIds.has(appId);
  }

  getAvatarUrl(imageName: string | undefined): string {
    if (!imageName) return '/covers.jpg';
    if (imageName.startsWith('http')) return imageName;
    return `${this.imgBase}/avatars/${imageName}`;
  }

  getResumeUrl(fileName: string | null): string | null {
    if (!fileName) return null;
    return `${this.imgBase}/resumes/${fileName}`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onConfirmApply(): void {
    if (!this.job || !this.coverLetterText.trim()) return;
    this.isSubmittingApply = true;
    this.jobService.applyToOffer(this.job.id, this.coverLetterText, this.selectedFile).subscribe({
      next: (res) => {
        this.isSubmittingApply = false;
        if (res.isSuccess) {
          // alert('Application sent successfully!'); // Removed alert
          this.showApplyModal = false;
          this.showSuccessModal = true; // Show Success Modal
          this.coverLetterText = '';
          this.selectedFile = undefined;
          if (this.job) this.job.isApplied = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingApply = false;
        alert('Failed to send application.');
        this.cdr.detectChanges();
      }
    });
  }

  // Helpers
  getArrangement(v: number) { return ['On-Site', 'Remote', 'Hybrid'][v] || 'On-Site'; }
  getType(v: number) { return ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'][v] || 'Full-time'; }
  getLevel(v: number) { return ['N/A', 'Junior', 'Mid', 'Senior', 'Executive'][v] || 'N/A'; }

  // Helper for UI Badge (للواجهة فقط إذا لم نستخدم الـ Dropdown)
  getApplicantStatusLabel(s: number) {
    return this.statusOptions.find(opt => opt.value === s)?.label || 'Pending';
  }
}