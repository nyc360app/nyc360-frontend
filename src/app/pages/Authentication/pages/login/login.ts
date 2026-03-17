import { Component, inject, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { take } from 'rxjs';
import { LoginService } from '../../Service/login-service';
import { AuthService } from '../../Service/auth';
import { ToastService } from '../../../../shared/services/toast.service';

declare var google: any;

import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AuthSuccessModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, AfterViewInit {

  private loginService = inject(LoginService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  loginForm!: FormGroup;
  isLoading = false;

  // Modal State
  showModal = false;
  modalTitle = 'Welcome Back!';
  modalMessage = 'You have successfully logged in.';
  redirectUrl = '/public/home';
  emailVerificationNotice = '';

  ngOnInit() {
    this.initForm();
    this.showVerificationNoticeFromRegistration();
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private showVerificationNoticeFromRegistration() {
    const verificationEmailSent = this.route.snapshot.queryParamMap.get('verificationEmailSent');
    if (verificationEmailSent !== 'true') {
      return;
    }

    const email = (this.route.snapshot.queryParamMap.get('email') || '').trim();
    if (email) {
      this.loginForm.patchValue({ email });
    }

    const emailSegment = email ? ` to ${email}` : '';
    this.emailVerificationNotice = `We sent a verification email${emailSegment}. Please verify your email before logging in.`;
    this.toastService.show(this.emailVerificationNotice, 'info', 5000);
  }

  ngAfterViewInit() {
    this.initializeGoogleButton();
  }

  initializeGoogleButton() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '124220032804-65up6tfjkjvch75p1k0skmou7csqi3c1.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleLogin(response)
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    }
  }

  handleGoogleLogin(response: any) {
    this.ngZone.run(() => {
      this.isLoading = true;

      this.loginService.loginWithGoogle(response.credential).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.isSuccess) {
            this.toastService.success('Google login successful!');
            this.modalTitle = 'Login Successful';
            this.modalMessage = `Welcome back!`;
            this.redirectUrl = '/public/home';
            this.showModal = true;
          } else {
            const errorMessage = res.error?.message || 'Google login failed';

            if (errorMessage.toLowerCase().includes('not found')) {
              this.toastService.error('No account found with this Google account. Please register first.');
            } else if (errorMessage.toLowerCase().includes('disabled') ||
              errorMessage.toLowerCase().includes('locked')) {
              this.toastService.error('Your account has been disabled. Please contact support.');
            } else {
              this.toastService.error(errorMessage);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;

          if (err.status === 0) {
            this.toastService.error('Unable to connect to server. Please check your internet connection.');
          } else if (err.status === 400) {
            this.toastService.error('Invalid Google credentials. Please try again.');
          } else if (err.status === 401) {
            this.toastService.error('Google authentication failed. Please try again.');
          } else if (err.status === 500) {
            this.toastService.error('Server error during Google login. Please try again later.');
          } else {
            this.toastService.error(err.error?.message || 'Google login failed. Please try again.');
          }

          console.error('Google login error:', err);
        }
      });
    });
  }

  loginError: string = '';

  onSubmit() {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      // Show specific validation errors
      if (this.loginForm.get('email')?.hasError('required')) {
        this.toastService.error('Email is required');
        return;
      }
      if (this.loginForm.get('email')?.hasError('email')) {
        this.toastService.error('Please enter a valid email address');
        return;
      }
      if (this.loginForm.get('password')?.hasError('required')) {
        this.toastService.error('Password is required');
        return;
      }
      if (this.loginForm.get('password')?.hasError('minlength')) {
        this.toastService.error('Password must be at least 6 characters');
        return;
      }

      this.toastService.warning('Please fill in the form correctly.');
      return;
    }

    this.isLoading = true;
    const loginData = this.loginForm.value;

    this.loginService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess) {
          // Check for 2FA
          if (response.data.twoFactorRequired) {
            this.toastService.info('Please verify your account with the OTP sent to your email');
            this.router.navigate(['/auth/verify-otp'], { queryParams: { email: loginData.email } });
          } else {
            this.authService.fetchFullUserInfo().pipe(take(1)).subscribe({
              next: (userInfoRes) => {
                const emailConfirmed = userInfoRes.data?.emailConfirmed;
                if (emailConfirmed === false) {
                  this.authService.logout();
                  this.loginError = 'Please verify your email before logging in.';
                  this.toastService.error('Please verify your email before logging in.');
                  return;
                }

                this.toastService.success('Login successful! Welcome back.');
                this.modalTitle = 'Welcome Back!';
                this.modalMessage = 'You have successfully logged in.';
                this.redirectUrl = '/public/home';
                this.showModal = true;
              },
              error: () => {
                this.toastService.success('Login successful! Welcome back.');
                this.modalTitle = 'Welcome Back!';
                this.modalMessage = 'You have successfully logged in.';
                this.redirectUrl = '/public/home';
                this.showModal = true;
              }
            });
          }
        } else {
          // Handle specific error messages from API
          const errorMessage = response.error?.message || 'Login failed';

          if (errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('incorrect') ||
            errorMessage.toLowerCase().includes('wrong')) {
            this.loginError = 'Invalid email or password. Please check your credentials.';
            this.toastService.error('Invalid email or password. Please try again.');
          } else if (errorMessage.toLowerCase().includes('not found')) {
            this.loginError = 'Account not found. Please register or check your email.';
            this.toastService.error('Account not found. Please check your email or register.');
          } else if (errorMessage.toLowerCase().includes('locked') ||
            errorMessage.toLowerCase().includes('suspended')) {
            this.loginError = 'Your account has been locked. Please contact support.';
            this.toastService.error('Your account has been locked. Please contact support.');
          } else if (errorMessage.toLowerCase().includes('verify') ||
            errorMessage.toLowerCase().includes('confirm')) {
            this.loginError = 'Please verify your email before logging in.';
            this.toastService.error('Please verify your email before logging in.');
          } else {
            this.loginError = errorMessage;
            this.toastService.error(errorMessage);
          }
        }
      },
      error: (err) => {
        this.isLoading = false;

        // Handle different types of errors
        if (err.status === 0) {
          this.loginError = 'Unable to connect to the backend server. Please ensure the local API is running.';
          this.toastService.error('Unable to connect to the backend server. Please ensure the local API is running.');
        } else if (err.status === 400) {
          this.loginError = err.error?.message || 'Invalid login credentials. Please try again.';
          this.toastService.error(this.loginError);
        } else if (err.status === 401) {
          this.loginError = 'Invalid email or password.';
          this.toastService.error('Invalid email or password.');
        } else if (err.status === 403) {
          this.loginError = 'Access denied. Your account may be locked.';
          this.toastService.error('Access denied. Your account may be locked.');
        } else if (err.status === 404) {
          this.loginError = 'Login service not found. Please contact support.';
          this.toastService.error('Login service not found. Please contact support.');
        } else if (err.status === 500) {
          this.loginError = 'Server error. Please try again later.';
          this.toastService.error('Server error. Please try again later.');
        } else if (err.status === 503) {
          this.loginError = 'Service temporarily unavailable. Please try again later.';
          this.toastService.error('Service temporarily unavailable. Please try again later.');
        } else {
          this.loginError = err.error?.message || 'An unexpected error occurred. Please try again.';
          this.toastService.error(this.loginError);
        }

        console.error('Login error:', err);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onModalClose() {
    this.showModal = false;
    this.router.navigateByUrl(this.redirectUrl);
  }
}