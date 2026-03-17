import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../pages/Authentication/Service/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // ---------------------------------------------------------------------------
  // 1. SSR Check (تجاهل السيرفر)
  // ---------------------------------------------------------------------------
  // لو الكود شغال على السيرفر، بنعدي الطلب لأن السيرفر معندوش LocalStorage
  // ده بيمنع مشاكل الوميض والخطأ أثناء التحميل الأولي
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // ---------------------------------------------------------------------------
  // 2. Refresh Logic (حل مشكلة الريفريش)
  // ---------------------------------------------------------------------------
  // لو المستخدم مش باين إنه مسجل دخول (State فاضية)، بنحاول نحمل التوكن من LocalStorage حالاً
  if (!authService.isLoggedIn()) {
    authService.loadUserFromToken();
  }

  // ---------------------------------------------------------------------------
  // 3. Token Check (الفحص الأساسي)
  // ---------------------------------------------------------------------------
  // بنبص في LocalStorage مباشرة
  const token = authService.getToken();

  if (!token) {
    // مفيش توكن أصلاً -> يبقى مش مسجل -> على صفحة اللوجين
    router.navigate(['/auth/login']);
    return false;
  }

  // زيادة تأكيد: لو بعد ما حملنا التوكن، لسه الدالة بتقول إننا مش LoggedIn
  // (ده معناه إن التوكن كان منتهي الصلاحية والخدمة عملت Logout لوحدها)
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // ---------------------------------------------------------------------------
  // 4. Role Based Access Control (RBAC)
  // ---------------------------------------------------------------------------
  const requiredRoles = route.data['roles'] as Array<string>;
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => authService.hasRole(role));
    if (!hasRole) {
      // معاه توكن سليم بس مش مسموح له يدخل هنا
      router.navigate(['/access-denied']);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Permission Check
  // ---------------------------------------------------------------------------
  const requiredPermission = route.data['permission'] as string;
  if (requiredPermission) {
    if (!authService.hasPermission(requiredPermission)) {
      router.navigate(['/access-denied']);
      return false;
    }
  }

  return true;
};