// src/app/pages/Dashboard/pages/dashboard/models/dashboard.models.ts

/**
 * Represents the aggregated statistics for the dashboard.
 */
export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalOrganizations: number;
  totalRegularUsers: number;
  verifiedAccounts: number;
  pendingAccounts: number;
  lockedAccounts: number;
}

/**
 * Simplified User object for the dashboard list.
 */
export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailConfirmed: boolean;
  avatarUrl?: string;
  lockoutEnd?: string | null;
}

/**
 * API Response Wrapper
 */
export interface UsersApiResponse {
  isSuccess: boolean;
  data: UserSummary[];
  totalCount: number;
}