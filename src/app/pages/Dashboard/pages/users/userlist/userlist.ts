import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../Service/list';
import { User } from '../models/userlist';
import { environment } from '../../../../../environments/environment';
import { RolesService } from '../../Roles/Service/role';
import { Role } from '../../Roles/models/role';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './userlist.html',
  styleUrls: ['./userlist.scss']
})
export class UserList implements OnInit {

  protected readonly environment = environment;

  // --- Dependencies ---
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // --- Data ---
  users: User[] = [];
  availableRoles: Role[] = [];
  isLoading = false;
  errorMessage = '';

  // --- Pagination ---
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';

  // --- Modal States ---
  showProfileModal = false;
  showRoleModal = false;
  selectedUser: User | null = null;
  isSaving = false;

  // --- Forms ---
  profileForm: FormGroup;
  selectedFile: File | null = null;

  // Single Role Selection Variable
  selectedRoleName: string = '';

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      bio: ['']
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadAllRoles();
  }

  // --- Load Users ---
  loadUsers() {
    this.isLoading = true;
    this.usersService.getAllUsers(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.isSuccess || res.IsSuccess) {
            this.users = res.data || res.Data || [];
            this.totalCount = res.totalCount ?? res.TotalCount ?? 0;
            this.totalPages = res.totalPages ?? res.TotalPages ?? 0;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // --- Load Roles for Modal ---
  loadAllRoles() {
    this.rolesService.getAllRoles().subscribe({
      next: (res: any) => {
        if (res.isSuccess || res.IsSuccess) this.availableRoles = res.data || res.Data || [];
      }
    });
  }

  // --- Edit Profile Logic ---
  openEditProfile(user: User) {
    this.selectedUser = user;
    this.selectedFile = null;

    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio
    });

    this.showProfileModal = true;
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  saveProfile() {
    if (this.profileForm.invalid || !this.selectedUser) return;
    this.isSaving = true;

    this.usersService.updateProfile(this.selectedUser.id, this.profileForm.value, this.selectedFile || undefined)
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.isSuccess) {
            alert('Profile updated successfully!');
            this.closeModals();
            this.loadUsers();
          } else {
            alert(res.error?.message || 'Update failed');
          }
        },
        error: () => { this.isSaving = false; alert('Network Error'); }
      });
  }

  // --- Manage Role Logic (Single Role) ---
  openRoleManager(user: User) {
    this.selectedUser = user;
    this.selectedRoleName = user.role || ''; // Load current role
    this.showRoleModal = true;
  }

  saveRoles() {
    if (!this.selectedUser || !this.selectedRoleName) return;
    this.isSaving = true;

    // Send single string to service
    this.usersService.updateUserRole(this.selectedUser.id, this.selectedRoleName)
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.isSuccess) {
            alert('Role updated successfully!');
            this.closeModals();
            this.loadUsers();
          } else {
            alert(res.error?.message || 'Failed to update role');
          }
        },
        error: () => { this.isSaving = false; alert('Network Error'); }
      });
  }

  // --- Helpers ---
  closeModals() {
    this.showProfileModal = false;
    this.showRoleModal = false;
    this.selectedUser = null;
  }

  onDelete(user: User) {
    if (confirm(`Delete user ${user.firstName}?`)) {
      this.usersService.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}