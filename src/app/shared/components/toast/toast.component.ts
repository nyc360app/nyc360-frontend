import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast-item" 
           [ngClass]="toast.type"
           @toastAnimation>
        <div class="icon-wrapper">
          <i class="bi" [ngClass]="{
            'bi-check-circle-fill': toast.type === 'success',
            'bi-x-circle-fill': toast.type === 'error',
            'bi-info-circle-fill': toast.type === 'info',
            'bi-exclamation-triangle-fill': toast.type === 'warning'
          }"></i>
        </div>
        <div class="content">
          <span class="title">{{ toast.type | titlecase }}</span>
          <span class="message">{{ toast.message }}</span>
        </div>
        <button class="close-btn" (click)="toastService.remove(toast.id)">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none; /* Allow clicking through container */
    }

    .toast-item {
      pointer-events: auto;
      min-width: 300px;
      max-width: 400px;
      background: rgba(20, 20, 20, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 4px solid;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      color: white;
      overflow: hidden;

      &.success { border-left-color: #00d26a; .icon-wrapper { color: #00d26a; background: rgba(0, 210, 106, 0.1); } }
      &.error { border-left-color: #f8312f; .icon-wrapper { color: #f8312f; background: rgba(248, 49, 47, 0.1); } }
      &.info { border-left-color: #007bff; .icon-wrapper { color: #007bff; background: rgba(0, 123, 255, 0.1); } }
      &.warning { border-left-color: #ffc107; .icon-wrapper { color: #ffc107; background: rgba(255, 193, 7, 0.1); } }

      .icon-wrapper {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }

      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .title { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .message { font-size: 0.9rem; color: #ccc; line-height: 1.4; }
      }

      .close-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 4px;
        transition: color 0.2s;
        
        &:hover { color: white; }
      }
    }
  `],
    animations: [
        trigger('toastAnimation', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent {
    toastService = inject(ToastService);
}
