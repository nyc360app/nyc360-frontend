import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyApplicationsService } from '../../service/my-applications';
import { MyApplication } from '../../models/my-applications';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ConfirmationService } from '../../../../../../shared/services/confirmation.service';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {
  private appsService = inject(MyApplicationsService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private loaderService = inject(GlobalLoaderService);

  applications: MyApplication[] = [];
  isLoading = true;
  isWithdrawing: number | null = null;

  ngOnInit() {
    this.loadApps();
  }

  loadApps() {
    this.isLoading = true;
    this.loaderService.show();
    this.appsService.getMyApplications().subscribe({
      next: (res) => {
        this.loaderService.hide();
        if (res.isSuccess) {
          this.applications = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }

  onWithdraw(appId: number) {
    this.confirmationService.confirm({
      title: 'Withdraw Application',
      message: 'Are you sure you want to withdraw this application?',
      confirmText: 'Withdraw',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.isWithdrawing = appId;
        this.appsService.withdrawApplication(appId).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.toastService.success('Application withdrawn successfully.');
              this.loadApps(); // إعادة تحميل القائمة
            }
            this.isWithdrawing = null;
          },
          error: () => {
            this.toastService.error('Failed to withdraw application.');
            this.isWithdrawing = null;
          }
        });
      }
    });
  }

  // Helpers for UI
  getStatusLabel(status: number): string {
    return ['Pending', 'Accepted', 'Rejected', 'Withdrawn'][status] || 'Unknown';
  }

  getStatusClass(status: number): string {
    return ['status-pending', 'status-accepted', 'status-rejected', 'status-withdrawn'][status] || '';
  }
}