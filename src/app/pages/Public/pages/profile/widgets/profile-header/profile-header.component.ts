import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileData } from '../../models/profile';
import { environment } from '../../../../../../environments/environment';
import { ProfileService } from '../../service/profile';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { filterPublicCommunityBadges } from '../../../../../../shared/utils/community-badge-policy';

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile-header.component.html',
    styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent {
    @Input() user: UserProfileData | null = null;
    @Input() isOwner: boolean = false;
    @Input() activeTab: string = 'posts';
    @Output() tabChange = new EventEmitter<string>();
    @Output() profileUpdate = new EventEmitter<void>();

    private profileService = inject(ProfileService);
    private toastService = inject(ToastService);
    private authService = inject(AuthService);
    protected readonly environment = environment;

    switchTab(tab: string) {
        this.tabChange.emit(tab);
    }

    triggerAvatarUpload() {
        if (!this.isOwner) return;
        document.getElementById('avatar-input')?.click();
    }

    triggerCoverUpload() {
        if (!this.isOwner) return;
        document.getElementById('cover-input')?.click();
    }

    onAvatarSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.profileService.uploadAvatar(file).subscribe((res: any) => {
                if (res && res.isSuccess) {
                    this.toastService.success('Avatar updated successfully!');
                    this.profileUpdate.emit();
                } else {
                    this.toastService.error('Failed to update avatar.');
                }
            });
        }
    }

    onCoverSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.profileService.uploadCover(file).subscribe((res: any) => {
                if (res && res.isSuccess) {
                    this.toastService.success('Cover photo updated!');
                    this.profileUpdate.emit();
                } else {
                    this.toastService.error('Failed to update cover photo.');
                }
            });
        }
    }

    resolveImage(url: string | null | undefined): string {
        if (!url) return 'assets/images/default-avatar.png';
        if (url.includes('http') || url.startsWith('data:')) return url;
        return `${environment.apiBaseUrl2}/avatars/${url}`;
    }

    resolveCover(url: string | null | undefined): string {
        if (!url) return 'assets/images/default-cover.jpg';
        if (url.includes('http') || url.startsWith('data:')) return url;
        return `${environment.apiBaseUrl2}/covers/${url}`;
    }

    get displayName() {
        if (!this.user) return '';
        const first = this.user.firstName || '';
        const last = this.user.lastName || '';
        if (first && last && first.toLowerCase() === last.toLowerCase()) return first;
        return `${first} ${last}`.trim() || 'User';
    }

    get isVerified(): boolean {
        return this.user?.stats?.isVerified === true;
    }

    get publicBadgeTags(): any[] {
        return filterPublicCommunityBadges(this.user?.tags || [])
            .map((tag: any) => ({
                ...tag,
                name: tag?.name ?? tag?.Name
            }))
            .filter((tag: any) => !!tag.name);
    }

    get locationDisplay(): string {
        if (!this.user?.location) return '';
        const { borough, neighborhood } = this.user.location;
        if (borough && neighborhood) {
            if (borough.toLowerCase() === neighborhood.toLowerCase()) return borough;
            return `${neighborhood}, ${borough}`;
        }
        return borough || neighborhood || '';
    }

    get applicationsCount(): number {
        // Try to get from user stats first
        if (this.user?.stats?.applicationsCount !== undefined) {
            return this.user.stats.applicationsCount;
        }
        // Fallback to auth service
        const userInfo = this.authService.getFullUserInfo();
        return userInfo?.applicationsCount ?? 0;
    }
}