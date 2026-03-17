import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NavigationTrackingService {
  private history: string[] = [];
  private historySubject = new BehaviorSubject<{ canGoBack: boolean; canGoForward: boolean }>({
    canGoBack: false,
    canGoForward: false
  });
  public historyState$ = this.historySubject.asObservable();

  private currentIndex = -1;
  private isNavigatingInternally = false;

  constructor(private router: Router, private location: Location) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (this.isNavigatingInternally) {
        this.isNavigatingInternally = false;
      } else {
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push(event.urlAfterRedirects);
        this.currentIndex = this.history.length - 1;
      }
      this.updateState();
    });
  }

  back(): void {
    if (this.canGoBack()) {
      this.isNavigatingInternally = true;
      this.currentIndex--;
      this.location.back();
      this.updateState();
    }
  }

  forward(): void {
    if (this.canGoForward()) {
      this.isNavigatingInternally = true;
      this.currentIndex++;
      this.location.forward();
      this.updateState();
    }
  }

  private updateState(): void {
    this.historySubject.next({
      canGoBack: this.canGoBack(),
      canGoForward: this.canGoForward()
    });
  }

  private canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  private canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
