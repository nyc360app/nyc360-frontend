import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CATEGORY_THEMES } from '../../../../../Public/Widgets/feeds/models/categories';
import { TopicModel, TopicRequest } from '../../models/topic.model';
import { TopicsService } from '../../service/topics.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
    selector: 'app-topics-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './topics-list.html',
    styleUrls: ['./topics-list.scss']
})
export class TopicsListComponent implements OnInit {
    private topicsService = inject(TopicsService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);

    topics: TopicModel[] = [];
    categories = Object.entries(CATEGORY_THEMES).map(([key, value]) => ({
        id: Number(key),
        ...value
    }));

    // Filtering & Search
    searchTerm = '';
    selectedCategory = -1;

    // Pagination Metadata
    currentPage = 1;
    pageSize = 20;
    totalPages = 0;
    totalCount = 0;
    isLoading = false;

    // Stats
    stats = [
        { title: 'Total Topics', value: 0, icon: 'bi-tags-fill', color: 'gold' },
        { title: 'Categories', value: 12, icon: 'bi-grid-fill', color: 'blue' },
        { title: 'Active', value: 0, icon: 'bi-check-circle-fill', color: 'green' }
    ];

    // Modal State
    isModalOpen = false;
    isEditMode = false;
    editingId = 0;
    modalData: TopicRequest = {
        Name: '',
        Description: '',
        Category: -1
    };

    ngOnInit() {
        this.loadData();
    }

    loadData(page: number = 1) {
        this.currentPage = page;
        this.isLoading = true;
        this.cdr.detectChanges();

        this.topicsService.getAllTopics(
            this.searchTerm,
            this.selectedCategory,
            this.currentPage,
            this.pageSize
        ).subscribe({
            next: (res: any) => {
                if (res.isSuccess || res.IsSuccess) {
                    this.topics = res.data || res.Data || [];
                    this.totalPages = res.totalPages ?? res.TotalPages ?? 0;
                    this.totalCount = res.totalCount ?? res.TotalCount ?? 0;

                    // Update Stats
                    this.stats[0].value = this.totalCount;
                    this.stats[2].value = this.totalCount; // Placeholder
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Network Error:', err);
                this.toastService.error('Failed to load topics');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onFilterChange() {
        this.loadData(1);
    }

    onDelete(id: number) {
        if (confirm('Are you sure you want to delete this topic?')) {
            this.topicsService.deleteTopic(id).subscribe({
                next: (res) => {
                    if (res.isSuccess || res.IsSuccess) {
                        this.toastService.success('Topic deleted successfully');
                        this.loadData(this.currentPage);
                    } else {
                        this.toastService.error('Failed to delete topic');
                    }
                },
                error: (err) => {
                    this.toastService.error('Error deleting topic');
                }
            });
        }
    }

    // --- Modal Logic ---

    openCreateModal() {
        this.isEditMode = false;
        this.modalData = { Name: '', Description: '', Category: -1 };
        this.isModalOpen = true;
    }

    openEditModal(topic: TopicModel) {
        this.isEditMode = true;
        this.editingId = topic.id;
        this.modalData = {
            Name: topic.name,
            Description: topic.description || '',
            Category: topic.category
        };
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    saveTopic() {
        if (!this.modalData.Name || this.modalData.Category < 0) {
            this.toastService.warning('Please fill in Name and Category');
            return;
        }

        if (this.isEditMode) {
            this.topicsService.updateTopic(this.editingId, this.modalData).subscribe({
                next: (res) => {
                    if (res.isSuccess || res.IsSuccess) {
                        this.toastService.success('Topic updated successfully');
                        this.closeModal();
                        this.loadData(this.currentPage);
                    } else {
                        this.toastService.error('Failed to update topic');
                    }
                },
                error: () => this.toastService.error('Error updating topic')
            });
        } else {
            this.topicsService.createTopic(this.modalData).subscribe({
                next: (res) => {
                    if (res.isSuccess || res.IsSuccess) {
                        this.toastService.success('Topic created successfully');
                        this.closeModal();
                        this.loadData(1);
                    } else {
                        this.toastService.error('Failed to create topic');
                    }
                },
                error: () => this.toastService.error('Error creating topic')
            });
        }
    }

    copyId(id: number) {
        navigator.clipboard.writeText(id.toString());
        this.toastService.info('ID copied to clipboard');
    }

    getCatName(id: number) { return this.categories.find(c => c.id === id)?.label || 'General'; }

    getAvatarColor(name: string): string {
        if (!name) return '#ccc';
        const colors = ['#FF7F50', '#2E86C1', '#28B463', '#884EA0', '#D35400', '#D4AF37'];
        const index = name.length % colors.length;
        return colors[index];
    }
}
