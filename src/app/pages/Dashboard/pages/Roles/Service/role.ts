// src/app/core/services/roles.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Role, RolesResponse, UpdateRolePermissionsRequest } from '../models/role';
import { StandardResponse } from '../models/standardresponse';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/roles-dashboard`;

  // --- Get All Roles ---
  getAllRoles(): Observable<RolesResponse<Role[]>> {
    return this.http.get<RolesResponse<Role[]>>(`${this.baseUrl}/all`);
  }

  // --- Get Single Role ---
  getRoleById(id: number): Observable<RolesResponse<Role>> {
    return this.http.get<RolesResponse<Role>>(`${this.baseUrl}/${id}`);
  }

  // --- Create Role ---
  createRole(roleName: string, permissions: string[]): Observable<RolesResponse<Role>> {
    const payload = { 
      name: roleName, 
      permissions: permissions 
    };
    return this.http.post<RolesResponse<Role>>(`${this.baseUrl}/create`, payload);
  }

  /**
   * UPDATE Role Permissions
   * FIXED: Now accepts the full payload (id, name, permissions)
   */
  updateRolePermissions(id: number, payload: UpdateRolePermissionsRequest): Observable<RolesResponse<Role>> {
    return this.http.put<RolesResponse<Role>>(`${this.baseUrl}/edit/${id}`, payload);
  }

  // --- Delete Role ---
  deleteRole(roleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${roleId}`);
  }


  // --- Get System Permissions (Mock) ---
  getAllPermissions(): Observable<StandardResponse<string[]>> {
    return this.http.get<StandardResponse<string[]>>(`${this.baseUrl}/all-permissions`);
  }

  
}
