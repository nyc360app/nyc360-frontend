import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top';
import { GlobalLoaderService } from './shared/components/global-loader/global-loader.service';
import { filter } from 'rxjs';

import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationModalComponent, GlobalLoaderComponent, BackToTopComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('my-ssr-app');
  private router = inject(Router);
  private loaderService = inject(GlobalLoaderService);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Only show loader for 'Main' entry pages (Outer pages)
        const mainPaths = ['', '/', '/public/home', '/public/housing/home', '/public/events/home', '/public/community'];
        const isMainPage = mainPaths.some(path => event.url === path) || event.url.startsWith('/public/category/');

        if (isMainPage) {
          this.loaderService.show();
        }
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.hide();
      }
    });
  }
}
