// src/app/pages/admin/edit-role/edit-role.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs'; 
import { RolesService } from '../Service/role';
import { UpdateRolePermissionsRequest } from '../models/role';

@Component({
  selector: 'app-edit-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-role.html',
  styleUrls: ['./edit-role.scss']
})
export class EditRoleComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private roleService = inject(RolesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  permissionsForm!: FormGroup;
  roleId!: number;
  roleName = '';
  allPermissions: string[] = [];
  errorMessage: string | null = null;
  isLoading = true;

  constructor() {
    this.permissionsForm = this.fb.group({
      permissions: this.fb.array([])
    });
  }

  get permissionsArray(): FormArray {
    return this.permissionsForm.get('permissions') as FormArray;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/admin/roles']);
      return;
    }
    this.roleId = +idParam;

    forkJoin({
      allPermissions: this.roleService.getAllPermissions(),
      roleData: this.roleService.getRoleById(this.roleId)
    }).subscribe({
      next: ({ allPermissions, roleData }) => {
        if (!roleData.isSuccess || !roleData.data) {
          this.errorMessage = "Role not found.";
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.allPermissions = allPermissions.data || [];
        const role = roleData.data; 
        
        // Store the Role Name to send it back during update
        this.roleName = role.name; 
        
        const currentRolePermissions: string[] = role.permissions || [];

        this.allPermissions.forEach(permission => {
          const isEnabled = currentRolePermissions.includes(permission);
          this.permissionsArray.push(new FormControl(isEnabled));
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = "Failed to load data.";
        this.isLoading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  // --- Submit Update ---
  onSubmit() {
    if (this.permissionsForm.invalid) return;
    this.isLoading = true;

    // 1. Filter selected permissions
    const selectedPermissions = this.permissionsForm.value.permissions
      .map((checked: boolean, i: number) => checked ? this.allPermissions[i] : null)
      .filter((v: string | null) => v !== null);

    // 2. Construct the FULL Payload (ID + Name + Permissions)
    const updatePayload: UpdateRolePermissionsRequest = {
      id: this.roleId,      // Mandatory for Backend logic
      name: this.roleName,  // Mandatory: Send back the existing name
      permissions: selectedPermissions
    };

    // 3. Call Service
    this.roleService.updateRolePermissions(this.roleId, updatePayload)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.isSuccess) {
            alert('Permissions updated successfully!');
            this.router.navigate(['/admin/Role']);
          } else {
            // Error handling
            this.errorMessage = res.error?.message || 'Update failed.';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Network error occurred.';
          console.error(err);
          this.cdr.detectChanges();
        }
      });
  }
}