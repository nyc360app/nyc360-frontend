// src/app/routes/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/Layout/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [
      { path: 'login', loadComponent: () => import('../pages/Authentication/pages/login/login').then(m => m.LoginComponent) },
      { path: 'register', redirectTo: 'register-selection', pathMatch: 'full' },
      { path: 'register-selection', loadComponent: () => import('../pages/Authentication/pages/register-selection/register-selection').then(m => m.RegisterSelectionComponent) },
      { path: 'verify-otp', loadComponent: () => import('../pages/Authentication/pages/verify-otp/verify-otp').then(m => m.VerifyOtpComponent) },
      { path: 'forgot-password', loadComponent: () => import('../pages/Authentication/pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
      { path: 'confirm-email', loadComponent: () => import('../pages/Authentication/pages/confirm-email/confirm-email').then(m => m.ConfirmEmailComponent) },
      { path: 'reset-password', loadComponent: () => import('../pages/Authentication/pages/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
      { path: 'register/visitor', loadComponent: () => import('../pages/Authentication/pages/register-visitor/register-visitor').then(m => m.RegisterVisitorComponent) },
      { path: 'register/business', loadComponent: () => import('../pages/Authentication/pages/register-business/register-business').then(m => m.RegisterBusinessComponent) },
      { path: 'register/organization', loadComponent: () => import('../pages/Authentication/pages/register-organization/register-organization').then(m => m.RegisterOrganizationComponent) },
      { path: 'register/newyorker', loadComponent: () => import('../pages/Authentication/pages/register-newyorker/register-newyorker').then(m => m.RegisterNewYorkerComponent) }
    ]
  }
];