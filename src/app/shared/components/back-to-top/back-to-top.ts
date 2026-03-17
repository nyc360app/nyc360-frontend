import { Component, HostListener, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.html',
  styleUrls: ['./back-to-top.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackToTopComponent {
  isVisible = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const shouldVisible = window.scrollY > 100;
      if (this.isVisible !== shouldVisible) {
        this.isVisible = shouldVisible;
        this.cdr.detectChanges();
        // console.log('BackToTop visibility:', this.isVisible);
      }
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
