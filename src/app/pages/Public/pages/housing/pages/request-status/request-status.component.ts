import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HousingAgentService } from '../../service/housing-agent.service';
import { ConfirmationService } from '../../../../../../shared/services/confirmation.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-housing-request-status',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './request-status.component.html',
    styleUrls: ['./request-status.component.scss']
})
export class HousingRequestStatusComponent {
    @Input() requestInfo: any;
    @Output() close = new EventEmitter<void>();
    @Output() statusUpdated = new EventEmitter<number>();

    private housingService = inject(HousingAgentService);
    private confirmationService = inject(ConfirmationService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    isCancelling = false;

    contactTypes = [
        { id: 0, name: 'Email' },
        { id: 1, name: 'Phone' },
        { id: 2, name: 'Text' }
    ];

    householdTypes = [
        { id: 0, name: 'Individual' },
        { id: 1, name: 'Couple' },
        { id: 2, name: 'Single Family' },
        { id: 3, name: 'Multi Family' }
    ];

    statusOptions = [
        { id: 0, name: 'Pending', class: 'bg-warning text-dark', icon: 'bi-hourglass-split' },
        { id: 1, name: 'Contacted', class: 'bg-info text-white', icon: 'bi-telephone-outbound' },
        { id: 2, name: 'In Progress', class: 'bg-primary text-white', icon: 'bi-arrow-repeat' },
        { id: 3, name: 'Closed', class: 'bg-secondary text-white', icon: 'bi-archive' },
        { id: 4, name: 'Cancelled', class: 'bg-danger text-white', icon: 'bi-x-circle' }
    ];

    getLabel(value: number, options: any[]): string {
        const item = options.find(o => o.id === value);
        return item ? item.name : 'Not Specified';
    }

    getStatus(value: number): any {
        return this.statusOptions.find(o => o.id === value) || this.statusOptions[0];
    }

    async onCancel() {
        if (this.isCancelling) return;

        const confirmed = await this.confirmationService.confirm({
            title: 'Cancel Request',
            message: 'Are you sure you want to cancel your housing request? This action cannot be undone.',
            confirmText: 'Yes, Cancel',
            cancelText: 'No, Keep it',
            type: 'danger'
        });

        if (confirmed) {
            this.isCancelling = true;
            this.cdr.markForCheck();
            this.housingService.cancelHousingRequest(this.requestInfo.id).subscribe({
                next: (response) => {
                    const isSuccess = response.IsSuccess || response.isSuccess;
                    if (isSuccess) {
                        this.toastService.success('Request cancelled successfully');
                        this.requestInfo.status = 4; // Update to Cancelled status locally
                        this.statusUpdated.emit(4);   // Notify parent
                    } else {
                        const errorMsg = response.Error?.Message || response.error?.message || 'Failed to cancel request';
                        this.toastService.error(errorMsg);
                    }
                    this.isCancelling = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    this.toastService.error('An error occurred while cancelling the request');
                    this.isCancelling = false;
                    this.cdr.markForCheck();
                }
            });
        }
    }

    onClose(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.close.emit();
    }
}
