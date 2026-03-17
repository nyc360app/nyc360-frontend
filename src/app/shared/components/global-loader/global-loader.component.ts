import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalLoaderService } from './global-loader.service';
import { map, switchMap, timer, of, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-nyc-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="displayLoading$ | async">
      <div class="loader-visual-container">
        <!-- Pure & Sharp Branding -->
        <div class="brand-display">
          <div class="logo-wrapper">
             <img src="/image_0_0.jpg" alt="NYC 360 Logo" class="official-logo">
             <div class="scan-line"></div>
          </div>
        </div>

        <!-- Professional Progress Context -->
        <div class="progress-context">
          <div class="animated-bar-shell">
            <div class="animated-bar-core"></div>
          </div>
          <div class="status-message">
            <span class="pulse-dot"></span>
            Initializing Systems...
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --nyc-blue: #003580;
      --nyc-orange: #FF7A00;
      --glass-bg: rgba(255, 255, 255, 0.98);
    }

    .loader-overlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      z-index: 100000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: overlayFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .loader-visual-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3rem;
    }

    /* --- Brand Design --- */
    .brand-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .logo-wrapper {
      position: relative;
      width: 240px;
      padding: 10px;
      animation: logoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .official-logo {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 10px 20px rgba(0, 53, 128, 0.15));
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, transparent, var(--nyc-orange), transparent);
      box-shadow: 0 0 15px var(--nyc-orange);
      animation: scanEffect 2s ease-in-out infinite;
    }

    .brand-text-reveal {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: -1px;
      display: flex;
      overflow: hidden;
    }

    .word-nyc {
      color: var(--nyc-blue);
      animation: revealUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      transform: translateY(100%);
    }

    .word-360 {
      color: var(--nyc-orange);
      animation: revealUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
      transform: translateY(100%);
    }

    /* --- Progress Design --- */
    .progress-context {
      width: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .animated-bar-shell {
      width: 100%;
      height: 6px;
      background: rgba(0, 53, 128, 0.08);
      border-radius: 100px;
      overflow: hidden;
      position: relative;
    }

    .animated-bar-core {
      position: absolute;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, var(--nyc-blue), var(--nyc-orange));
      border-radius: 100px;
      animation: progressMove 1.6s infinite cubic-bezier(0.445, 0.05, 0.55, 0.95);
    }

    .status-message {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--nyc-blue);
      text-transform: uppercase;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background: var(--nyc-orange);
      border-radius: 50%;
      animation: dotPulse 1s infinite alternate;
    }

    /* --- Keyframes --- */
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes logoEntrance {
      from { transform: scale(0.8) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    @keyframes scanEffect {
      0% { top: 0; opacity: 0; }
      50% { top: 100%; opacity: 1; }
      100% { top: 0; opacity: 0; }
    }

    @keyframes revealUp {
      to { transform: translateY(0); }
    }

    @keyframes progressMove {
      0% { left: -40%; }
      50% { width: 60%; }
      100% { left: 100%; width: 20%; }
    }

    @keyframes dotPulse {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.5); opacity: 0.4; }
    }
  `]
})
export class GlobalLoaderComponent {
  private loaderService = inject(GlobalLoaderService);

  displayLoading$ = this.loaderService.loading$.pipe(
    distinctUntilChanged(),
    switchMap(isLoading => {
      if (isLoading) {
        return of(true);
      } else {
        // Professional transition delay (1.8s)
        return timer(2000).pipe(map(() => false));
      }
    })
  );
}
