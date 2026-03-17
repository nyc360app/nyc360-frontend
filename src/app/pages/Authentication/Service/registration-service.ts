// src/app/pages/Authentication/services/registration.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  RegisterNormalUserRequest,
  RegisterOrganizationRequest,
  RegisterRequest
} from '../models/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  // --- 1. Normal User Registration ---
  registerNormalUser(data: RegisterNormalUserRequest): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register/normal-user`, data);
  }

  // --- 2. Organization Registration ---
  registerOrganization(data: RegisterOrganizationRequest): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register/organization`, data);
  }

  // --- 3. Generic Register (Legacy or Fallback) ---
  register(data: RegisterRequest): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register`, data);
  }

  // --- 4. Visitor Registration ---
  registerVisitor(data: any): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register/visitor`, data);
  }

  // --- 5. Business Registration ---
  registerBusiness(data: any): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register/business`, data);
  }

  // --- 6. New Yorker Registration ---
  registerNewYorker(data: any): Observable<AuthResponse<any>> {
    return this.http.post<AuthResponse<any>>(`${this.apiUrl}/register/newyorker`, data);
  }
}