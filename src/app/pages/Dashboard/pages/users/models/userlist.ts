// src/app/pages/Dashboard/pages/users/models/userlist.ts

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  bio?: string;
  avatarUrl?: string;
  role: string; // Single string role
  lockoutEnabled: boolean;
  lockoutEnd?: string;
}

export interface UsersResponse {
  isSuccess: boolean;
  data: User[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: { code: string; message: string } | null;
}

// Fixed: Payload for updating a single role
export interface UpdateUserRoleRequest {
  roleName: string;
}