import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, switchMap, throwError, filter, take } from 'rxjs';
import { AuthService } from '../pages/Authentication/Service/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // 1. Lazy Injection to prevent Circular Dependency
  // We don't inject AuthService here yet, we assume we can read from localStorage directly first if needed
  // OR we use inject() but ensure AuthService doesn't inject HttpClient which uses this interceptor directly in a loop.
  // The safest way in modern Angular functional interceptors:

  let authReq = req;
  let token = null;

  // Read token directly from storage to avoid initial circular dependency
  if (typeof localStorage !== 'undefined') {
    token = localStorage.getItem('nyc360_token');
  }

  // Attach Token if exists
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  const injector = inject(Injector);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // 🛑 Case 1: 401 Unauthorized (Token Expired or Invalid)
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh-token')) {
        const authService = injector.get(AuthService);
        return authService.refreshAccessToken().pipe(
          switchMap((newToken) => {
            if (newToken) {
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(newReq);
            }
            // If No token returned, logout already happened in AuthService
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            return throwError(() => refreshErr);
          })
        );
      }

      // 🛑 Case 2: 403 Forbidden (Accessing unauthorized resource)
      // Strict Security: If a user tries to access a forbidden resource, we assume a potential breach or role mismatch.
      if (error.status === 403) {
        console.warn('⛔ Security Alert: 403 Forbidden access attempt.');
        // Optional: You could logout here too if you want to be extremely strict
        // authService.logout(); 
      }

      // 🛑 Case 3: 0 Unknown Error (Server Down or CORS)
      if (error.status === 0) {
        console.error('⚠️ Network security check failed: Server unreachable.');
      }

      return throwError(() => error);
    })
  );
};