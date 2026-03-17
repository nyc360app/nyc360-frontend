import { Component, OnInit, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../Authentication/Service/auth';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {

  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  isMenuOpen = false;
  isLoggedIn = false;
  currentUsername: string | null = null;

  private userSub!: Subscription;

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUsername = user ? (user.username || user.unique_name || user.email) : null;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : 'auto';
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
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }
}