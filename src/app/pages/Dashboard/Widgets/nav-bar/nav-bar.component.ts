import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // مهم للتاريخ والـ Classes
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';
import { NavigationControlsComponent } from "../navigation-controls/navigation-controls.component";

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NavigationControlsComponent],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  providers: [DatePipe]
})
export class NavBarComponent {

  public authService = inject(AuthService);



  isMenuOpen: boolean = false;
  currentDate: Date = new Date();
  canViewUsers = false;
  canViewRoles = false;
  canViewRSS = false;
  canViewDashboard = false;
  canViewCommunities = false;
  canViewSupport = false;

  ngOnInit() {
    // Check Permissions Dynamically
    this.canViewUsers = this.authService.hasPermission('Permissions.Users.View');
    this.canViewRoles = this.authService.hasPermission('Permissions.Roles.View');
    this.canViewRSS = this.authService.hasPermission('Permissions.Posts.View'); // Or RSS permission
    this.canViewDashboard = this.authService.hasPermission('Permissions.Dashboard.View');
    this.canViewCommunities = this.authService.hasPermission('Permissions.Communities.View');
    // For now, allow Support view if Dashboard view is allowed, or add specific permission
    this.canViewSupport = true; // this.authService.hasPermission('Permissions.Support.View'); 
  }





  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  handleSubscribeClick() {
    console.log('Subscribe clicked');
  }
}