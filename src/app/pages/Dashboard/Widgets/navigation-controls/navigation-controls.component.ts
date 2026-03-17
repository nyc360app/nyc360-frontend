import { Component } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NavigationTrackingService } from '../service/navigation-tracking.service';

@Component({
  selector: 'app-navigation-controls',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './navigation-controls.component.html',
  styleUrls: ['./navigation-controls.component.css']
})
export class NavigationControlsComponent {
  historyState$: Observable<{ canGoBack: boolean; canGoForward: boolean }>;

  constructor(private navigationTracker: NavigationTrackingService) {
    this.historyState$ = this.navigationTracker.historyState$;
  }

  goBack(): void {
    this.navigationTracker.back();
  }

  goForward(): void {
    this.navigationTracker.forward();
  }
}
