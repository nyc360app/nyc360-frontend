import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { Forum } from '../../models/forum';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';

@Component({
    selector: 'app-forums-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './forums-list.html',
    styleUrls: ['./forums-list.scss']
})
export class ForumsListComponent implements OnInit {
    private forumService = inject(ForumService);
    private loaderService = inject(GlobalLoaderService);

    forums: Forum[] = [];
    isLoading = false;

    ngOnInit() {
        this.loadForums();
    }

    loadForums() {
        this.isLoading = true;
        this.loaderService.show();
        this.forumService.getForums().subscribe({
            next: (res) => {
                this.isLoading = false;
                this.loaderService.hide();
                if (res.isSuccess) {
                    this.forums = res.data || [];
                }
            },
            error: () => {
                this.isLoading = false;
                this.loaderService.hide();
            }
        });
    }

    resolveIcon(iconUrl: string): string {
        if (!iconUrl) return '/MAIN Blue & Orange.png';
        return `https://nyc360.runasp.net/forums/${iconUrl}`;
    }
}
