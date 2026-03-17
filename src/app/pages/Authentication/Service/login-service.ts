// src/app/pages/Authentication/services/login.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth'; // We need AuthService to save the token state
import { environment } from '../../../environments/environment';
import { AuthResponse, GoogleLoginRequest, LoginRequest, LoginResponseData } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private http = inject(HttpClient);
  private authService = inject(AuthService); // Inject AuthService to update state upon success

  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private oauthUrl = `${environment.apiBaseUrl}/oauth`;

  // --- 1. Standard Login ---
  login(data: LoginRequest): Observable<AuthResponse<LoginResponseData>> {
    return this.http.post<AuthResponse<LoginResponseData>>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(res => this.handleSuccess(res)) // Centralized success handling
      );
  }

  // --- 2. Google Login ---
  loginWithGoogle(idToken: string): Observable<AuthResponse<LoginResponseData>> {
    const payload: GoogleLoginRequest = { idToken: idToken };
    return this.http.post<AuthResponse<LoginResponseData>>(`${this.oauthUrl}/google`, payload)
      .pipe(
        tap(res => this.handleSuccess(res))
      );
  }

  // --- 3. Two-Factor Authentication (2FA) Verification ---
  // Note: This is often part of the login flow
  verify2FA(email: string, code: string): Observable<AuthResponse<LoginResponseData>> {
    return this.http.post<AuthResponse<LoginResponseData>>(`${this.apiUrl}/2fa-verify`, { email, code })
      .pipe(
        tap(res => this.handleSuccess(res))
      );
  }

  // --- Helper: Handle Successful Login Response ---
  private handleSuccess(res: AuthResponse<LoginResponseData>) {
    if (res.isSuccess && res.data && res.data.accessToken) {
      // If 2FA is NOT required, we proceed to save tokens immediately.
      // If 2FA IS required, the component will handle redirection to OTP page.
      if (!res.data.twoFactorRequired) {
        this.authService.saveTokens(res.data.accessToken, res.data.refreshToken);
      }
    }
  }
}