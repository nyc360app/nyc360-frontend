import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { LoginService } from '../../Service/login-service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthSuccessModalComponent } from '../../../../shared/components/auth-success-modal/auth-success-modal.component';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthSuccessModalComponent],
  templateUrl: './verify-otp.html',
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
export class VerifyOtpComponent implements OnInit {


  
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loginService = inject(LoginService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  email = '';
  isLoading = false;

  // Modal State
  showModal = false;
  modalTitle = 'Verification Successful';
  modalMessage = 'You have successfully verified your identity.';
  redirectUrl = '/public/home';

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.email) {
      this.toastService.error('Missing email information.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^[0-9]*$')]]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.loginService.verify2FA(this.email, this.form.value.code).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.modalTitle = 'Verification Successful';
          this.modalMessage = 'You have successfully verified your identity.';
          this.redirectUrl = '/public/home';
          this.showModal = true;
        } else {
          this.toastService.error(res.error?.message || 'Invalid verification code.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Verification failed. Please try again.');
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