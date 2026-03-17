// src/app/pages/Dashboard/pages/Roles/models/role.ts

// Assuming StandardResponse is defined elsewhere (as previously discussed)
// import { StandardResponse } from 'your-path-to-api-response.model'; 

export interface Role {
  id: number;
  name: string;
  permissions: string[];
  // **FIXED ERROR:** Added the missing property
  contentLimit: number; 
}

// Used for fetching a list of roles
export interface RolesResponse<T> {
    isSuccess: boolean;
    data?: T; // T will be Role[] in roles-list component
    error?: { code: string; message: string; };
}

export interface UpdateRolePermissionsRequest {
  id: number;
    name: string;
    permissions: string[];
}