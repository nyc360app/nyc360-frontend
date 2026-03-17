import { Component, OnInit, inject, OnDestroy, PLATFORM_ID, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../Authentication/Service/auth';
import { CATEGORY_THEMES } from '../feeds/models/categories';
import { CATEGORY_LIST } from '../../../models/category-list';
import { GlobalSearchComponent } from './components/global-search/global-search';


@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {

  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isMenuOpen = false;
  isLoggedIn = false;
  currentUsername: string | null = null;
  hasNotifications = true;
  isProfileDropdownOpen = false;
  isScrolled = false;

  // المتغير اللي ماسك القسم الحالي
  currentActiveCat: any = null;

  private userSub!: Subscription;
  private routerSub!: Subscription;
  navLinks = CATEGORY_LIST;
  // Categories definition
  categories = CATEGORY_LIST;

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.currentUsername = user.username || user.unique_name || user.email;
      } else {
        this.currentUsername = null;
      }
    });

    // Listen to route changes
    this.routerSub = this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveCategory(event.urlAfterRedirects);
    });

    // Initial check
    if (isPlatformBrowser(this.platformId)) {
      this.updateActiveCategory(this.router.url);
    }
  }

  updateActiveCategory(url: string) {
    if (url === '/' || url === '/public/home' || url.includes('/public/home')) {
      this.currentActiveCat = null;
      return;
    }

    // Logic to keep buttons persistent if URL matches category route OR any of its sub-links
    const found = this.categories.find(cat => {
      const isMainRoute = cat.route ? url.startsWith(cat.route) : false;
      const isSubRoute = cat.topLinks ? (cat.topLinks as any[]).some(link => url.startsWith(link.route)) : false;
      return isMainRoute || isSubRoute;
    });

    if (found) {
      this.currentActiveCat = found;
    } else {
      this.currentActiveCat = null;
    }
    this.cdr.detectChanges();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : 'auto';
    }
  }

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    event.preventDefault(); // Prevent accidental navigation or weird behavior
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.cdr.detectChanges(); // Force update
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event) {
    this.isProfileDropdownOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 20;
    }
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }


  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.routerSub) this.routerSub.unsubscribe();
  }
}