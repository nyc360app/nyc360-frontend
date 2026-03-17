import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingAgentService } from '../../../../service/housing-agent.service';
import { ImageService } from '../../../../../../../../shared/services/image.service';
import { ImgFallbackDirective } from '../../../../../../../../shared/directives/img-fallback.directive';

@Component({
    selector: 'app-agent-overview',
    standalone: true,
    imports: [CommonModule, RouterModule, ImgFallbackDirective],
    templateUrl: './agent-overview.html',
    styleUrls: ['../../agent-dashboard.scss'] // Use the same styles for now
})
export class AgentOverviewComponent implements OnInit {
    private housingService = inject(HousingAgentService);
    public imageService = inject(ImageService);

    stats: any = null;
    trends: any[] = [];
    topNeighborhoods: any[] = [];
    recentInquiries: any[] = [];
    isLoading = true;

    // Chart properties
    chartPoints: string = '';
    chartLabels: { x: number, label: string }[] = [];

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.isLoading = true;
        this.housingService.getAgentDashboard().subscribe({
            next: (res: any) => {
                const responseData = res.data;
                if (res.isSuccess && responseData) {
                    this.stats = responseData.stats;
                    this.trends = responseData.trends || [];
                    this.topNeighborhoods = responseData.topNeighborhoods || [];
                    this.recentInquiries = responseData.recentInquiries?.data || [];

                    this.prepareChart();
                }
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    prepareChart() {
        if (!this.trends || this.trends.length === 0) {
            this.chartPoints = '';
            return;
        }

        const width = 1000;
        const height = 300;
        const padding = 40;

        const maxVal = Math.max(...this.trends.map(t => t.count), 1);
        const divisor = this.trends.length > 1 ? this.trends.length - 1 : 1;
        const stepX = (width - padding * 2) / divisor;

        const points = this.trends.map((t, i) => {
            const x = this.trends.length > 1 ? padding + i * stepX : width / 2;
            const y = height - padding - (t.count / maxVal) * (height - padding * 2);
            return { x, y, label: t.label || t.date };
        });

        if (points.length === 0) return;

        let path = `M ${points[0].x} ${points[0].y}`;

        if (points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                path += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
            }
        } else {
            path += ` L ${points[0].x + 1} ${points[0].y}`;
        }

        this.chartPoints = path;

        const labelIndices = points.length > 1
            ? [0, Math.floor(points.length / 4), Math.floor(points.length / 2), Math.floor(points.length * 3 / 4), points.length - 1]
            : [0];

        this.chartLabels = labelIndices.filter((v, i, a) => a.indexOf(v) === i).map(idx => ({
            x: points[idx].x,
            label: points[idx].label
        }));
    }

    getTypeLabel(type: number): string {
        return type === 0 ? 'Rent' : 'Sale';
    }

    getInitials(name: string): string {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'reviewed': return 'status-reviewed';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return 'status-default';
        }
    }
}
