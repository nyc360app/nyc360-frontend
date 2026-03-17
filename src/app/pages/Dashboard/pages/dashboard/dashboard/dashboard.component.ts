import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardService } from '../service/dashboard';
import { ToastService } from '../../../../../shared/services/toast.service';
import { DashboardStats, UserSummary } from '../models/dashboard.';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  today: Date = new Date();

  get statCards() {
    return [
      { label: 'Total Users', value: this.stats.totalUsers, icon: 'bi-people-fill', bg: 'rgba(212, 175, 55, 0.15)', trend: 12 },
      { label: 'Verified Accounts', value: this.stats.verifiedAccounts, icon: 'bi-patch-check-fill', bg: 'rgba(46, 204, 113, 0.15)', trend: 8 },
      { label: 'Organizations', value: this.stats.totalOrganizations, icon: 'bi-buildings-fill', bg: 'rgba(52, 152, 219, 0.15)', trend: 5 },
      { label: 'Banned / Locked', value: this.stats.lockedAccounts, icon: 'bi-shield-lock-fill', bg: 'rgba(231, 76, 60, 0.15)', trend: -2 }
    ];
  }

  // Expose environment to HTML for image URLs
  protected readonly environment = environment;

  // Dependencies
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  // --- State Variables ---
  stats: DashboardStats = {
    totalUsers: 0, totalAdmins: 0, totalOrganizations: 0, totalRegularUsers: 0,
    verifiedAccounts: 0, pendingAccounts: 0, lockedAccounts: 0
  };

  recentUsers: UserSummary[] = [];
  isLoading = true;

  // --- Computed Analytics (Getters) ---

  // Percentage of Verified Users
  get verificationRate(): number {
    return this.stats.totalUsers > 0
      ? (this.stats.verifiedAccounts / this.stats.totalUsers) * 100
      : 0;
  }

  // Percentage of Admin Users
  get adminRatio(): number {
    return this.stats.totalUsers > 0
      ? (this.stats.totalAdmins / this.stats.totalUsers) * 100
      : 0;
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading = true;

    this.dashboardService.getDashboardAnalytics()
      .pipe(
        // Finalize ensures this runs whether successful OR failed (Fixes infinite load)
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges(); // Force UI update
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Dashboard Data Loaded:', data);
          this.stats = data.stats;
          this.recentUsers = data.recentUsers;
        },
        error: (err) => {
          console.error('Critical Error loading dashboard:', err);
          this.toastService.error('Failed to load dashboard analytics');
        }
      });
  }

  // Helper to generate initials for avatar
  getInitials(firstName: string, lastName: string): string {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
  }
}