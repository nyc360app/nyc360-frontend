import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationOptions } from '../../services/confirmation.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-content animate-pop" role="dialog" aria-modal="true">
        
        <div class="modal-icon" [ngClass]="options.type || 'info'">
            <i class="bi" [ngClass]="getIcon()"></i>
        </div>

        <h3 class="modal-title">{{ options.title }}</h3>
        <p class="modal-message">{{ options.message }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" (click)="cancel()">{{ options.cancelText || 'Cancel' }}</button>
          <button class="btn-confirm" [ngClass]="options.type || 'primary'" (click)="confirm()">
            {{ options.confirmText || 'Confirm' }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .modal-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        margin: 0 auto 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;

        &.danger { background: #fee2e2; color: #ef4444; }
        &.warning { background: #fef3c7; color: #f59e0b; }
        &.success { background: #dcfce7; color: #22c55e; }
        &.info { background: #e0f2fe; color: #0ea5e9; }
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .modal-message {
        color: #6b7280;
        font-size: 0.95rem;
        margin-bottom: 2rem;
        line-height: 1.5;
    }

    .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;

        button {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 0.95rem;

            &:active { transform: scale(0.98); }
        }

        .btn-cancel {
            background: #f3f4f6;
            color: #4b5563;
            &:hover { background: #e5e7eb; }
        }

        .btn-confirm {
            color: white;
            
            &.danger { background: #ef4444; &:hover { background: #dc2626; } }
            &.warning { background: #f59e0b; &:hover { background: #d97706; } }
            &.success { background: #22c55e; &:hover { background: #16a34a; } }
            &.info, &.primary { background: #0066cc; &:hover { background: #0052a3; } }
        }
    }

    @keyframes popIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class ConfirmationModalComponent {
    private service = inject(ConfirmationService);

    isOpen = false;
    options: ConfirmationOptions = { title: '', message: '' };

    constructor() {
        this.service.showModal$.subscribe(opts => {
            this.options = opts;
            this.isOpen = true;
        });
    }

    confirm() {
        this.service.resolve(true);
        this.isOpen = false;
    }

    cancel() {
        this.service.resolve(false);
        this.isOpen = false;
    }

    onOverlayClick(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.cancel();
        }
    }

    getIcon(): string {
        switch (this.options.type) {
            case 'danger': return 'bi-exclamation-triangle-fill';
            case 'warning': return 'bi-exclamation-circle-fill';
            case 'success': return 'bi-check-circle-fill';
            default: return 'bi-info-circle-fill';
        }
    }
}
