import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../Service/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthSuccessModalComponent],
  templateUrl: './forgot-password.html',
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;

  // Modal State
  showModal = false;
  modalTitle = 'Email Sent!';
  modalMessage = 'Please check your inbox for password reset instructions.';
  redirectUrl = '/auth/login';

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Please enter a valid email.');
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword({ email: this.form.value.email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.modalTitle = 'Check Your Inbox';
          this.modalMessage = `We sent a reset link to ${this.form.value.email}. It might take a few minutes.`;
          this.showModal = true;
          this.form.reset();
        } else {
          this.toastService.error(res.error?.message || 'Action failed.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Network error.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onModalClose() {
    this.showModal = false;
    this.router.navigateByUrl(this.redirectUrl);
  }
}