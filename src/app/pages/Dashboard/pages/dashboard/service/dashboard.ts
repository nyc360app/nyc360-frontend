// src/app/pages/Dashboard/pages/dashboard/services/dashboard.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardStats, UsersApiResponse, UserSummary } from '../models/dashboard.';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/users-dashboard`;

  /**
   * Fetches user data and calculates dashboard statistics on the client-side.
   * We request a large page size (100) to get a good representative sample for stats.
   */
  getDashboardAnalytics(): Observable<{ stats: DashboardStats, recentUsers: UserSummary[] }> {
    const params = new HttpParams().set('page', 1).set('pageSize', 100);

    return this.http.get<any>(`${this.baseUrl}/all`, { params }).pipe(
      map(response => {
        // Safe access: Support both camelCase and PascalCase from API
        const users: UserSummary[] = response.data || response.Data || [];

        // --- 1. Calculate Statistics ---
        const stats: DashboardStats = {
          totalUsers: response.totalCount ?? response.TotalCount ?? users.length,

          // Role Distribution
          totalAdmins: users.filter(u => u.role === 'SuperAdmin').length,
          totalOrganizations: users.filter(u => u.role === 'Organization').length,
          totalRegularUsers: users.filter(u => u.role === 'User' || !u.role).length,

          // Account Status
          verifiedAccounts: users.filter(u => u.emailConfirmed).length,
          pendingAccounts: users.filter(u => !u.emailConfirmed).length,
          lockedAccounts: users.filter(u => u.lockoutEnd !== null).length
        };

        // --- 2. Get Recent Users (Top 5) ---
        // Assuming API returns newest first, otherwise we slice the top 5
        const recentUsers = users.slice(0, 5);

        return { stats, recentUsers };
      }),

      // --- Error Handling ---
      // If API fails, return empty stats so the page doesn't crash (Infinite Load Fix)
      catchError(error => {
        console.error('Dashboard Analytics Error:', error);
        return of({
          stats: {
            totalUsers: 0, totalAdmins: 0, totalOrganizations: 0, totalRegularUsers: 0,
            verifiedAccounts: 0, pendingAccounts: 0, lockedAccounts: 0
          },
          recentUsers: []
        });
      })
    );
  }
}