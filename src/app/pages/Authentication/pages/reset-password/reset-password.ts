import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Service/auth';
import { trigger, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthSuccessModalComponent],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ResetPasswordComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  resetForm: FormGroup;
  isLoading = false;

  emailParam: string | null = null;
  tokenParam: string | null = null;

  // Modal State
  showModal = false;
  modalTitle = 'Password Reset!';
  modalMessage = 'Your password has been updated successfully. Please log in with your new credentials.';
  redirectUrl = '/auth/login';

  constructor() {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.emailParam = this.route.snapshot.queryParamMap.get('email');
    this.tokenParam = this.route.snapshot.queryParamMap.get('token');

    if (this.tokenParam) {
      this.tokenParam = this.tokenParam.replace(/ /g, '+');
    }

    if (!this.emailParam || !this.tokenParam) {
      this.toastService.error('Invalid link. Please request a new password reset.');
      this.resetForm.disable();
    }
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetForm.value;

    if (newPassword !== confirmPassword) {
      this.toastService.error('Passwords do not match.');
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword({
      email: this.emailParam!,
      token: this.tokenParam!,
      newPassword: newPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.modalTitle = 'Password Updated';
          this.modalMessage = 'Your password has been reset successfully. You can now log in.';
          this.showModal = true;
        } else {
          this.toastService.error(res.error?.message || 'Failed to reset password.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Network error or expired token.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onModalClose() {
    this.showModal = false;
    this.router.navigateByUrl(this.redirectUrl);
  }
}