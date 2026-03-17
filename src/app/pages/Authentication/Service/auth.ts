import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, of, filter, take, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

// Models
import {
  AuthResponse, ChangePasswordRequest, ConfirmEmailRequest, ForgotPasswordRequest,
  RefreshTokenRequest, ResetPasswordRequest, LoginResponseData
} from '../models/auth';
import { UserInfo } from '../models/user-info';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = `${environment.apiBaseUrl}/auth`;

  private tokenKey = 'nyc360_token';
  private refreshTokenKey = 'nyc360_refresh_token';
  private userInfoKey = 'nyc360_user_info';

  // User State
  public currentUser$ = new BehaviorSubject<any>(null);
  private fullUserInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  public fullUserInfo$ = this.fullUserInfoSubject.asObservable();

  // Refresh Token State
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private isRefreshingToken = false;

  constructor() {
    // محاولة تحميل المستخدم عند بدء التطبيق
    this.loadUserFromToken();
    this.startTokenCheck();
  }

  // ============================================================
  // 1. HELPER METHODS (GETTERS) ✅ (New & Critical)
  // ============================================================

  /**
   * ✅ دالة جاهزة لجلب الـ ID الخاص بالمستخدم الحالي كرقم
   * استخدمها في أي Component عشان تعرف مين اللي فاتح
   */
  getUserId(): number | null {
    const user = this.currentUser$.value;
    if (user && user.id) {
      return Number(user.id);
    }
    return null;
  }

  getUserName(): string {
    return this.currentUser$.value?.username || 'Guest';
  }

  getAvatar(): string | null {
    return this.currentUser$.value?.imageUrl || this.fullUserInfoSubject.value?.avatarUrl || null;
  }

  getFullUserInfo(): UserInfo | null {
    return this.fullUserInfoSubject.value;
  }

  isLoggedIn(): boolean {
    // التحقق من وجود قيمة في الـ BehaviorSubject
    return !!this.currentUser$.value;
  }

  // ============================================================
  // 2. PERMISSION & ROLE CHECKS
  // ============================================================

  hasPermission(permission: string): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (this.hasRole('SuperAdmin')) return true;
    const userPermissions: string[] = user.permissions || [];
    return userPermissions.includes(permission);
  }

  hasRole(targetRole: string): boolean {
    const user = this.currentUser$.value;
    if (!user || !user.role) return false;
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    if (userRoles.includes('SuperAdmin')) return true;
    return userRoles.includes(targetRole);
  }

  /**
   * ✅ Check if user has specific 'housing' permission/tag in token or full user info
   */
  hasHousingPermission(): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (this.hasRole('SuperAdmin')) return true;

    // 1. Check JWT permissions
    const perms = user.permissions || [];
    if (perms.includes('housing')) return true;

    // 2. Check tags in full user info
    const fullInfo = this.fullUserInfoSubject.value;
    if (fullInfo && fullInfo.tags) {
      const housingTagIds = [1854, 1855, 1856];
      return fullInfo.tags.some(tag => housingTagIds.includes(tag.id));
    }

    return false;
  }

  hasCategoryPermission(category: string): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (this.hasRole('SuperAdmin')) return true;

    // Normalize
    const target = category.toLowerCase();

    // 1. Specific Logic for Housing (Legacy support)
    if (target === 'housing') {
      return this.hasHousingPermission();
    }

    // 2. Check Permissions String
    const perms = user.permissions || [];
    if (perms.includes(target)) return true;

    return false;
  }

  // ============================================================
  // 3. API CALLS (ACCOUNT MANAGEMENT Only)
  // ============================================================

  refreshToken(data: RefreshTokenRequest): Observable<AuthResponse<LoginResponseData>> {
    // We send { Token: refreshToken }
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {
      Token: data.token
    }).pipe(
      map(response => {
        const isSuccess = response.IsSuccess ?? response.isSuccess ?? false;
        const error = response.Error || response.error || null;
        let loginData: LoginResponseData | any = null;

        const rawData = response.Data || response.data;
        if (rawData) {
          loginData = {
            accessToken: rawData.AccessToken ?? rawData.accessToken,
            refreshToken: rawData.RefreshToken ?? rawData.refreshToken,
            twoFactorRequired: rawData.TwoFactorRequired ?? rawData.twoFactorRequired ?? false
          };
        }

        return { isSuccess, data: loginData, error };
      })
    );
  }

  confirmEmail(data: ConfirmEmailRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/confirm-email`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/password-reset`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, data);
  }

  fetchFullUserInfo(): Observable<AuthResponse<UserInfo>> {
    return this.http.get<any>(`${environment.apiBaseUrl}/users/my-info`).pipe(
      map(response => {
        // 1. Map Response Wrapper (PascalCase -> camelCase)
        const isSuccess = response.IsSuccess ?? response.isSuccess ?? false;
        const error = response.Error || response.error || null;
        let data: UserInfo | any = null;

        // 2. Map Data Object if exists
        const rawData = response.Data || response.data;
        if (rawData) {
          data = this.mapToUserInfo(rawData);
        }

        return {
          isSuccess,
          data,
          error
        };
      }),
      tap((res) => {
        if (res.isSuccess && res.data) {
          // ✅ تخزين البيانات في LocalStorage عشان تكون متاحة علطول
          this.fullUserInfoSubject.next(res.data);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.userInfoKey, JSON.stringify(res.data));
          }
        }
      })
    );
  }

  // ============================================================
  // 5. DATA MAPPING HELPERS (Fix PascalCase <-> camelCase)
  // ============================================================

  private mapToUserInfo(data: any): UserInfo {
    return {
      type: data.Type ?? data.type,
      firstName: data.FirstName ?? data.firstName,
      lastName: data.LastName ?? data.lastName,
      headline: data.Headline ?? data.headline,
      bio: data.Bio ?? data.bio,
      email: data.Email ?? data.email,
      phoneNumber: data.PhoneNumber ?? data.phoneNumber,
      avatarUrl: data.AvatarUrl ?? data.avatarUrl,
      coverImageUrl: data.CoverImageUrl ?? data.coverImageUrl,
      twoFactorEnabled: data.TwoFactorEnabled ?? data.twoFactorEnabled,
      emailConfirmed: data.EmailConfirmed ?? data.emailConfirmed,
      isVerified: data.IsVerified ?? data.isVerified,
      isPending: data.IsPending ?? data.isPending ?? false,
      applicationsCount: data.ApplicationsCount ?? data.applicationsCount ?? 0,

      location: data.Location ? {
        id: data.Location.Id ?? data.Location.id,
        borough: data.Location.Borough ?? data.Location.borough,
        code: data.Location.Code ?? data.Location.code,
        neighborhoodNet: data.Location.NeighborhoodNet ?? data.Location.neighborhoodNet,
        neighborhood: data.Location.Neighborhood ?? data.Location.neighborhood,
        zipCode: data.Location.ZipCode ?? data.Location.zipCode,
      } : (data.location || null),

      interests: data.Interests ?? data.interests ?? [],

      socialLinks: (data.SocialLinks ?? data.socialLinks ?? []).map((l: any) => ({
        id: l.Id ?? l.id,
        platform: l.Platform ?? l.platform,
        url: l.Url ?? l.url
      })),

      positions: (data.Positions ?? data.positions ?? []).map((p: any) => ({
        title: p.Title ?? p.title,
        company: p.Company ?? p.company,
        startDate: p.StartDate ?? p.startDate,
        endDate: p.EndDate ?? p.endDate,
        isCurrent: p.IsCurrent ?? p.isCurrent
      })),

      education: (data.Education ?? data.education ?? []).map((e: any) => ({
        school: e.School ?? e.school,
        degree: e.Degree ?? e.degree,
        fieldOfStudy: e.FieldOfStudy ?? e.fieldOfStudy,
        startDate: e.StartDate ?? e.startDate,
        endDate: e.EndDate ?? e.endDate
      })),

      tags: (data.Tags ?? data.tags ?? []).map((t: any) => ({
        id: t.Id ?? t.id,
        name: t.Name ?? t.name
      })),

      businessInfo: data.BusinessInfo ? {
        organizationType: data.BusinessInfo.OrganizationType ?? data.BusinessInfo.organizationType,
        profitModel: data.BusinessInfo.ProfitModel ?? data.BusinessInfo.profitModel,
        industry: data.BusinessInfo.Industry ?? data.BusinessInfo.industry
      } : (data.businessInfo || null)
    };
  }

  // ============================================================
  // 4. STATE MANAGEMENT & HELPERS
  // ============================================================

  public getIsRefreshingToken(): boolean {
    return this.isRefreshingToken;
  }

  public getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  /**
   * ✅ Centralized Refresh Logic
   * Handles synchronization: if a refresh is already in progress, it returns an observable that waits for it.
   */
  public refreshAccessToken(): Observable<string | null> {
    if (this.isRefreshingToken) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1)
      );
    }

    this.isRefreshingToken = true;
    this.refreshTokenSubject.next(null);

    const refreshTokenVal = this.getRefreshToken();
    if (!refreshTokenVal) {
      this.isRefreshingToken = false;
      this.logout();
      return of(null);
    }

    return this.refreshToken({ token: refreshTokenVal }).pipe(
      map(res => {
        this.isRefreshingToken = false;
        if (res.isSuccess && res.data) {
          this.saveTokens(res.data.accessToken, res.data.refreshToken);
          this.refreshTokenSubject.next(res.data.accessToken);
          return res.data.accessToken;
        }
        this.logout();
        return null;
      }),
      catchError(err => {
        this.isRefreshingToken = false;
        this.logout();
        return of(null);
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.userInfoKey); // ✅ مسح بيانات المستخدم عند الخروج
    }
    this.currentUser$.next(null);
    this.fullUserInfoSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) return localStorage.getItem(this.tokenKey);
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) return localStorage.getItem(this.refreshTokenKey);
    return null;
  }

  public saveTokens(accessToken: string, refreshToken: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, accessToken);
      if (refreshToken) localStorage.setItem(this.refreshTokenKey, refreshToken);

      // تحديث حالة المستخدم فوراً بعد الحفظ
      this.loadUserFromToken();
    }
  }

  /**
   * 🔥 Check Token Validity Periodically
   * يقوم بتشغيل فحص دوري للتأكد من أن التوكن لم ينتهي أثناء استخدام التطبيق
   */
  private startTokenCheck() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check every 30 seconds
    setInterval(() => {
      this.checkTokenExpiration();
    }, 30000);
  }

  private checkTokenExpiration() {
    if (this.isRefreshingToken) return;

    const token = this.getToken();
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return;

      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeLeft = expirationTime - currentTime;

      // If token will expire in less than 20 seconds, or it is already expired -> Refresh
      if (timeLeft < 20000) {
        console.log('🔄 Proactive Token Refresh starting...');
        this.refreshAccessToken().subscribe({
          next: (token) => {
            if (token) {
              console.log('✅ Token refreshed successfully (Proactive)');
            }
          },
          error: (err) => {
            console.error('❌ Proactive refresh error:', err);
          }
        });
      }
    } catch (e) {
      console.error('Invalid token during check:', e);
      this.logout();
    }
  }

  /**
   * 🔥 Load User + Check Expiration
   * تقوم بفك التوكن واستخراج البيانات وتخزينها في currentUser$
   */
  public loadUserFromToken() {
    // 1. لو مش براوزر، اخرج (SSR Safety)
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getToken();

    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        // 2. فحص صلاحية التوكن (Expiration Check)
        if (decoded.exp && (decoded.exp * 1000) < Date.now()) {
          console.warn('⚠️ Token expired. Logging out.');
          this.logout();
          return;
        }

        // 3. استخراج البيانات (Mapping Claims)
        const user = {
          id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
            || decoded['nameid']
            || decoded['sub']
            || decoded['id']
            || decoded['userId'],

          email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
            || decoded['email'],

          role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            || decoded['role'],

          username: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
            || decoded['unique_name']
            || decoded['sub']
            || '',

          // لو الصورة بتيجي في التوكن
          imageUrl: decoded['ImageUrl'] || decoded['image'] || null,

          permissions: decoded.permissions || decoded.Permissions || []
        };

        // تحديث الحالة فوراً
        this.currentUser$.next(user);

        // ✅ محاولة استرجاع البيانات من LocalStorage أولاً (Cache First)
        const cachedInfo = localStorage.getItem(this.userInfoKey);
        if (cachedInfo) {
          try {
            this.fullUserInfoSubject.next(JSON.parse(cachedInfo));
          } catch (e) {
            console.error('Error parsing cached user info', e);
          }
        }

        // جلب البيانات الكاملة للمستخدم
        this.fetchFullUserInfo().subscribe({
          next: (res) => {
            if (res.isSuccess) {
              // Subject is already updated in the `tap` of fetchFullUserInfo
              // this.fullUserInfoSubject.next(res.data); <--- Done in tap
            }
          },
          error: (err) => {
            console.error('Error fetching full user info:', err);
          }
        });

      } catch (e) {
        console.error('Invalid Token found during load:', e);
        this.logout(); // Redirect to login on error
      }
    } else {
      // ✅ User requested constraint: If token missing, assume logged out state.
      // The guard will handle redirect if route is protected.
      this.currentUser$.next(null);
      this.fullUserInfoSubject.next(null);
    }
  }
}