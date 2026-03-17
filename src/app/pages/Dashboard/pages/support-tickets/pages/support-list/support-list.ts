import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';

export interface Ticket {
    id: number;
    subject: string;
    creatorName: string;
    creatorEmail: string;
    status: TicketStatus;
    createdAt: string;
    assignedAdminName?: string;
}

export enum TicketStatus {
    Active = 1,
    Closed = 2
}

@Component({
    selector: 'app-support-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './support-list.html',
    styleUrls: ['./support-list.scss']
})
export class SupportListComponent implements OnInit {

    private http = inject(HttpClient);

    tickets: Ticket[] = [];
    filteredTickets: Ticket[] = [];
    isLoading = true;
    page = 1;
    pageSize = 50; // Increased to handle filtering better locally if needed

    // Search & Filter
    searchTerm: string = '';
    statusFilter: string = 'all';

    // Modal State
    selectedTicketId: number | null = null;
    replyMessage: string = '';
    showReplyModal: boolean = false;

    ngOnInit() {
        this.loadTickets();
    }

    loadTickets() {
        this.isLoading = true;
        const url = `${environment.apiBaseUrl}/support-dashboard/list?Page=${this.page}&PageSize=${this.pageSize}`;

        this.http.get<any>(url).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    // Map to camelCase if backend sends PascalCase
                    this.tickets = res.data.map((t: any) => ({
                        id: t.id || t.Id,
                        subject: t.subject || t.Subject,
                        creatorName: t.creatorName || t.CreatorName,
                        creatorEmail: t.creatorEmail || t.CreatorEmail,
                        status: t.status || t.Status,
                        createdAt: t.createdAt || t.CreatedAt,
                        assignedAdminName: t.assignedAdminName || t.AssignedAdminName
                    }));
                    this.filterTickets();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading tickets', err);
                this.isLoading = false;
            }
        });
    }

    filterTickets() {
        const search = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';

        this.filteredTickets = this.tickets.filter(t => {
            const subject = (t.subject || '').toLowerCase();
            const creator = (t.creatorName || '').toLowerCase();
            const email = (t.creatorEmail || '').toLowerCase();
            const id = (t.id ? t.id.toString() : '');

            const matchesSearch = !search ||
                subject.includes(search) ||
                creator.includes(search) ||
                id.includes(search) ||
                email.includes(search);

            const matchesStatus = this.statusFilter === 'all' ||
                (this.statusFilter === 'active' && t.status === TicketStatus.Active) ||
                (this.statusFilter === 'closed' && t.status === TicketStatus.Closed);

            return matchesSearch && matchesStatus;
        });
    }

    onSearch() {
        this.filterTickets();
    }

    // --- Actions ---

    openReply(id: number) {
        this.selectedTicketId = id;
        this.replyMessage = '';
        this.showReplyModal = true;
    }

    closeReply() {
        this.showReplyModal = false;
        this.selectedTicketId = null;
    }

    submitReply() {
        if (!this.selectedTicketId || !this.replyMessage.trim()) return;

        const url = `${environment.apiBaseUrl}/support-dashboard/${this.selectedTicketId}/reply`;
        const payload = { ReplyMessage: this.replyMessage };

        this.http.post<any>(url, payload).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    alert('Reply sent successfully!');
                    this.closeReply();
                    this.loadTickets(); // Refresh
                } else {
                    alert('Failed to send reply.');
                }
            },
            error: (err) => console.error(err)
        });
    }

    closeTicket(id: number) {
        if (!confirm('Are you sure you want to close this ticket?')) return;

        const url = `${environment.apiBaseUrl}/support-dashboard/${id}/close`;
        this.http.patch<any>(url, {}).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.loadTickets(); // Refresh
                } else {
                    alert('Failed to close ticket.');
                }
            },
            error: (err) => console.error(err)
        });
    }

    // --- Helpers ---
    getStatusName(status: number): string {
        return status === TicketStatus.Active ? 'Active' : 'Closed';
    }

    getStatusClass(status: number): string {
        return status === TicketStatus.Active ? 'status-active' : 'status-closed';
    }
}
