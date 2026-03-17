import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-auth-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" @fadeIn (click)="close()">
      <div class="modal-content" @scaleIn (click)="$event.stopPropagation()">
        <div class="success-icon-wrapper">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        
        <h2 class="title">{{ title }}</h2>
        <p class="message">{{ message }}</p>
        
        <button class="btn-continue" (click)="close()">
          {{ buttonText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 24px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      position: relative;
      overflow: hidden;
    }

    .success-icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 10px;
    }

    .message {
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 30px;
    }

    .btn-continue {
      background: #0A3D91;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 50px;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
      
      &:hover {
        background: #002a6b;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(10, 61, 145, 0.3);
      }
    }

    /* Checkmark Animation */
    .checkmark {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: block;
      stroke-width: 2.5;
      stroke: #4bb71b;
      stroke-miterlimit: 10;
      box-shadow: inset 0px 0px 0px #4bb71b;
      animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
    }

    .checkmark__circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: #4bb71b;
      fill: none;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .checkmark__check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }

    @keyframes stroke {
      100% {
        stroke-dashoffset: 0;
      }
    }
    @keyframes scale {
      0%, 100% {
        transform: none;
      }
      50% {
        transform: scale3d(1.1, 1.1, 1);
      }
    }
    @keyframes fill {
      100% {
        box-shadow: inset 0px 0px 0px 30px #fff; 
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
    ])
  ]
})
export class AuthSuccessModalComponent {
  @Input() visible = false;
  @Input() title = 'Success!';
  @Input() message = 'Operation completed successfully.';
  @Input() buttonText = 'Continue';

  @Output() closed = new EventEmitter<void>();

  close() {
    this.visible = false;
    this.closed.emit();
  }
}
