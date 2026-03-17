import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForumDashboardService } from '../../service/forum-dashboard.service';
import { ForumDashboardDto, ModeratorDto } from '../../models/forum-dashboard.model';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { UsersService } from '../../../users/Service/list';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-forums-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forums-list.html',
    styleUrls: ['./forums-list.scss']
})
export class ForumsListComponent implements OnInit {
    private forumsService = inject(ForumDashboardService);
    private usersService = inject(UsersService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    protected readonly environment = environment;

    forums: ForumDashboardDto[] = [];
    isLoading = true;
    isSaving = false;

    // Edit Modal
    showEditModal = false;
    editForm: FormGroup;
    selectedForum: ForumDashboardDto | null = null;
    selectedFile: File | null = null;

    // Moderators Modal
    showModeratorsModal = false;
    currentForumIdForMods: number | null = null;
    selectedModerators: ModeratorDto[] = [];
    userSearchTerm = '';
    searchResults: any[] = [];
    isSearching = false;
    private searchSubject = new Subject<string>();

    constructor() {
        this.editForm = this.fb.group({
            title: ['', Validators.required],
            slug: ['', Validators.required],
            description: ['', Validators.required],
            isActive: [true]
        });

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(term => {
            if (term.length >= 2) {
                this.performUserSearch(term);
            } else {
                this.searchResults = [];
            }
        });
    }

    ngOnInit() {
        this.loadForums();
    }

    loadForums() {
        this.isLoading = true;
        this.forumsService.getForums().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.forums = res.data;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.error('Failed to load forums');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onDelete(forum: ForumDashboardDto) {
        if (confirm(`Are you sure you want to delete the forum "${forum.title}"?`)) {
            this.forumsService.deleteForum(forum.id).subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.toastService.success('Forum deleted successfully');
                        this.loadForums();
                    } else {
                        this.toastService.error(res.error?.message || 'Failed to delete forum');
                    }
                },
                error: () => this.toastService.error('Network error')
            });
        }
    }

    // Create Modal Logic
    openCreateModal() {
        this.selectedForum = null;
        this.selectedFile = null;
        this.editForm.reset({
            title: '',
            slug: '',
            description: '',
            isActive: true
        });
        this.showEditModal = true;
    }

    // Edit Modal Logic
    openEditModal(forum: ForumDashboardDto) {
        this.selectedForum = forum;
        this.selectedFile = null;
        this.editForm.patchValue({
            title: forum.title,
            slug: forum.slug,
            description: forum.description,
            isActive: forum.isActive
        });
        this.showEditModal = true;
    }

    onFileSelected(event: any) {
        if (event.target.files.length > 0) {
            this.selectedFile = event.target.files[0];
        }
    }

    saveForum() {
        if (this.editForm.invalid) return;

        this.isSaving = true;
        const formData = {
            ...this.editForm.value,
            iconFile: this.selectedFile || undefined
        };

        const observable = this.selectedForum
            ? this.forumsService.updateForum({ id: this.selectedForum.id, ...formData })
            : this.forumsService.createForum(formData);

        observable.subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.isSuccess) {
                    this.toastService.success(this.selectedForum ? 'Forum updated successfully' : 'Forum created successfully');
                    this.showEditModal = false;
                    this.loadForums();
                } else {
                    this.toastService.error(res.error?.message || 'Operation failed');
                }
            },
            error: () => {
                this.isSaving = false;
                this.toastService.error('Network error');
            }
        });
    }

    // Moderators Modal Logic
    openModeratorsModal(forum: ForumDashboardDto) {
        this.currentForumIdForMods = forum.id;
        this.selectedModerators = [...forum.moderators];
        this.userSearchTerm = '';
        this.searchResults = [];
        this.showModeratorsModal = true;
    }

    searchUsers() {
        this.searchSubject.next(this.userSearchTerm);
    }

    performUserSearch(term: string) {
        this.isSearching = true;
        this.usersService.getAllUsers(1, 10, term).subscribe({
            next: (res: any) => {
                const users = res.data || res.Data || [];
                // Filter out users already in selectedModerators
                this.searchResults = users
                    .filter((u: any) => !this.selectedModerators.some(sm => sm.id === u.id))
                    .map((u: any) => ({
                        id: u.id,
                        username: u.userName || u.username,
                        fullName: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.userName,
                        imageUrl: u.profileImageUrl || u.avatarUrl || u.imageUrl,
                        type: 1 // Default type
                    }));
                this.isSearching = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        });
    }

    addModerator(user: any) {
        this.selectedModerators.push({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
            type: user.type
        });
        this.searchResults = this.searchResults.filter(u => u.id !== user.id);
    }

    removeModerator(userId: number) {
        this.selectedModerators = this.selectedModerators.filter(m => m.id !== userId);
    }

    saveModerators() {
        if (!this.currentForumIdForMods) return;

        this.isSaving = true;
        const request = {
            forumId: this.currentForumIdForMods,
            moderatorIds: this.selectedModerators.map(m => m.id)
        };

        this.forumsService.updateModerators(request).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.isSuccess) {
                    this.toastService.success('Moderators updated successfully');
                    this.showModeratorsModal = false;
                    this.loadForums();
                } else {
                    this.toastService.error(res.error?.message || 'Update failed');
                }
            },
            error: () => {
                this.isSaving = false;
                this.toastService.error('Network error');
            }
        });
    }
}
