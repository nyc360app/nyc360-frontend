// src/app/pages/admin/role-list/roles-list.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Added CurrencyPipe import for potential future use, though not used here
import { Router, RouterModule } from '@angular/router';
import { RolesService } from '../Service/role';
import { Role } from '../models/role'; // Role model should include 'contentLimit'

@Component({
  selector: 'app-roles-list',
  standalone: true,
  // Note: CurrencyPipe is added to imports for robust number formatting, though 'number' pipe is sufficient for KB.
  imports: [CommonModule, RouterModule],
  templateUrl: './roles-list.html',
  styleUrls: ['./roles-list.scss']
})
export class RolesListComponent implements OnInit {

  // --- Dependency Injection ---
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef); // To manually trigger change detection after async calls
  private router = inject(Router);

  // --- State Variables ---
  roles: Role[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadRoles();
  }

  /**
   * Fetch all roles from the API.
   */
  loadRoles() {
    this.isLoading = true;
    this.errorMessage = '';

    this.rolesService.getAllRoles().subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.isSuccess || res.IsSuccess) {
          this.roles = res.data || res.Data || [];
          this.cdr.detectChanges(); // Trigger change detection
        } else {
          this.errorMessage = (res.error?.message || res.Error?.Message) || 'Failed to load roles.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Network Error: Could not fetch roles.';
        console.error(err);
        this.cdr.detectChanges(); // Trigger change detection
      }
    });
  }

  /**
   * Delete Role Logic:
   * 1. Validates ID presence.
   * 2. Confirms action.
   * 3. Calls API.
   */
  onDelete(role: Role) {
    if (!role.id) {
      alert(`Error: Role ID is missing for "${role.name}".`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.rolesService.deleteRole(role.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Role deleted successfully!');
          this.loadRoles(); // Refresh the list
        } else {
          this.isLoading = false;
          alert(res.error?.message || 'Failed to delete role.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('An unexpected error occurred while deleting.');
      }
    });
  }
}