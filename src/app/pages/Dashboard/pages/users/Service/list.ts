// src/app/pages/Dashboard/pages/users/Service/list.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsersResponse, UpdateUserRoleRequest } from '../models/userlist';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/users-dashboard`;

  // --- 1. Get All Users ---
  getAllUsers(page: number, pageSize: number, search: string): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search) params = params.set('search', search);

    return this.http.get<UsersResponse>(`${this.baseUrl}/all`, { params });
  }

  // --- 2. Update User Profile ---
  updateProfile(id: number, data: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('email', data.email);
    formData.append('bio', data.bio || '');
    
    if (file) {
      formData.append('avatar', file);
    }

    return this.http.put(`${this.baseUrl}/update/profile`, formData);
  }

  // --- 3. Update User Role (Fixed for Single Role) ---
  updateUserRole(userId: number, roleName: string): Observable<any> {
    const payload: UpdateUserRoleRequest = { roleName: roleName };
    return this.http.put(`${this.baseUrl}/${userId}/roles`, payload);
  }

  // --- 4. Delete User ---
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}