import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../Authentication/Service/auth';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    providers: [DatePipe]
})
export class SidebarComponent implements OnInit {
    public authService = inject(AuthService);

    isCollapsed = false;
    isMobileMenuOpen = false;

    canViewUsers = false;
    canViewRoles = false;
    canViewRSS = false;
    canViewDashboard = false;
    canViewCommunities = false;
    canViewSupport = false;
    canViewHousing = false;
    canViewForums = false;

    ngOnInit() {
        this.canViewUsers = this.authService.hasPermission('Permissions.Users.View');
        this.canViewRoles = this.authService.hasPermission('Permissions.Roles.View');
        this.canViewRSS = this.authService.hasPermission('Permissions.Posts.View');
        this.canViewDashboard = this.authService.hasPermission('Permissions.Dashboard.View');
        this.canViewCommunities = this.authService.hasPermission('Permissions.Communities.View');
        this.canViewHousing = this.authService.hasPermission('Permissions.Housing.View');
        this.canViewForums = this.authService.hasPermission('Permissions.Forums.View') || this.canViewDashboard;
        this.canViewSupport = true; // Based on NavBar implementation
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
    }
}
