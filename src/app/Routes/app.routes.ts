import { Routes } from '@angular/router';

/**
 * NYC-360 Main Routing Table
 * Standardized with Maximum Lazy Loading for optimal performance.
 */
export const routes: Routes = [

  // ============================================================
  // 1. LANDING & GENERAL (Minimal initial bundle)
  // ============================================================
  {
    path: '',
    loadComponent: () => import('../pages/Layout/landing-layout/landing-layout').then(m => m.LandingLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('../pages/landing/pages/landing-page/landing-page').then(m => m.LandingPage)
      },
      {
        path: 'about',
        loadComponent: () => import('../pages/landing/pages/about-us/about-us').then(m => m.AboutUsComponent)
      }
    ]
  },

  // ============================================================
  // 2. AUTH MODULE (Lazy Loaded)
  // ============================================================
  {
    path: 'auth',
    loadChildren: () => import('./auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ============================================================
  // 3. PUBLIC MODULE (Lazy Loaded with Layout & Guards)
  // ============================================================
  {
    path: 'public',
    loadChildren: () => import('./public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // ============================================================
  // 4. ADMIN DASHBOARD (Lazy Loaded with RBAC Guards)
  // ============================================================
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // ============================================================
  // 5. SYSTEM ROUTES
  // ============================================================
  {
    path: 'access-denied',
    loadComponent: () => import('../pages/Public/Widgets/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },

  {
    path: '**',
    loadComponent: () => import('../pages/Public/Widgets/not-found/not-found').then(m => m.NotFoundComponent)
  }
];