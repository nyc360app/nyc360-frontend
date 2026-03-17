// src/app/pages/admin/role-form/role-form.component.ts (المصحح)

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // 💡 إضافة ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RolesService } from '../Service/role';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleFormComponent implements OnInit {
  
  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // 💡 حقن ChangeDetectorRef

  // --- Form & State ---
  roleForm!: FormGroup;
  allPermissions: string[] = [];
  isLoading = true; // يبدأ بـ true لعرض Spinner
  errorMessage = '';

  constructor() {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(3)]],
      permissions: this.fb.array([]) 
    });
  }

  get permissionsArray(): FormArray {
    return this.roleForm.get('permissions') as FormArray;
  }

  ngOnInit(): void {
    // 1. Fetch all available system permissions
    this.rolesService.getAllPermissions().subscribe({
      next: (perms) => {
        // تأكد من أن 'data' ليست null قبل الاستخدام
        this.allPermissions = perms.data || []; 

        // 2. Initialize FormArray
        this.allPermissions.forEach(() => {
          this.permissionsArray.push(new FormControl(false));
        });

        this.isLoading = false; // يتم تعيينها بعد الانتهاء من تهيئة البيانات

        // 💡 الحل: إخبار Angular بفحص التغييرات مرة أخرى
        // هذا يجبر Angular على تشغيل دورة الكشف عن التغييرات مرة أخرى
        // بعد تعيين isLoading = false، مما يحل مشكلة NG0100
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Failed to load permissions.";
        this.isLoading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  // ... (onSubmit method remains the same)
  onSubmit() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const name = this.roleForm.value.roleName;

    const selectedPermissions = this.roleForm.value.permissions
      .map((checked: boolean, i: number) => checked ? this.allPermissions[i] : null)
      .filter((v: string | null) => v !== null);

    this.rolesService.createRole(name, selectedPermissions).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          alert('Role created successfully');
          this.router.navigate(['/admin/Role']);
        } else {
          this.errorMessage = res.error?.message || 'Failed to create role';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = 'Network error occurred.';
      }
    });
  }
}