import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ImageService {

    private get baseApiUrl(): string {
        return (environment.apiBaseUrl2 || '').endsWith('/')
            ? environment.apiBaseUrl2.slice(0, -1)
            : environment.apiBaseUrl2;
    }

    // Global Default Assets
    // Global Default Assets
    readonly DEFAULT_POST = '';
    readonly DEFAULT_AVATAR = ''; // We can keep a generic avatar if preferred, but user said "remove all"
    readonly DEFAULT_HOUSING = '';
    readonly PLACEHOLDER = '';

    constructor() { }

    /**
     * Resolves a post image URL with fallback to default
     */
    resolvePostImage(post: any): string {
        if (!post) return this.DEFAULT_POST;

        let attachment = post.attachments?.[0];
        let url = attachment?.url || post.imageUrl;

        // 1. If no direct image, check parent (Shared Post)
        if ((!url || url.trim() === '') && post.parentPost) {
            attachment = post.parentPost.attachments?.[0];
            url = attachment?.url || post.parentPost.imageUrl;
        }

        // 2. If still no image, return global default
        if (!url || url.trim() === '') return this.DEFAULT_POST;

        return this.cleanAndResolve(url, this.DEFAULT_POST);
    }

    /**
     * Checks if a post has any image (direct or inherited)
     */
    hasImage(post: any): boolean {
        if (!post) return false;
        const direct = !!(post.attachments?.[0]?.url || post.imageUrl);
        if (direct) return true;
        if (post.parentPost) return this.hasImage(post.parentPost);
        return false;
    }

    /**
     * Resolves an author/avatar image URL with fallback
     */
    resolveAvatar(author: any): string {
        if (!author) return this.DEFAULT_AVATAR;

        let url = typeof author === 'string' ? author : author.imageUrl || author.avatarUrl;

        if (!url || url.trim() === '') return this.DEFAULT_AVATAR;

        return this.cleanAndResolveAvatar(url, this.DEFAULT_AVATAR);
    }

    /**
     * Resolves a simple image URL
     */
    resolveImageUrl(url: string | null | undefined, type: 'post' | 'avatar' | 'housing' = 'post'): string {
        const fallback = type === 'avatar' ? this.DEFAULT_AVATAR :
            type === 'housing' ? this.DEFAULT_HOUSING :
                this.DEFAULT_POST;

        if (!url || url.trim() === '') {
            return '';
        }

        if (type === 'avatar') {
            return this.cleanAndResolveAvatar(url, fallback);
        }

        return this.cleanAndResolve(url, fallback, type);
    }

    /**
     * Generates an alternative URI by switching between 'posts' and 'housing' folders.
     * Useful for fallback searching.
     */
    getAlternativeUrl(currentUrl: string): string | null {
        if (!currentUrl || !currentUrl.startsWith('http')) return null;

        const baseUrl = this.baseApiUrl;
        if (currentUrl.includes(`${baseUrl}/posts/`)) {
            return currentUrl.replace(`${baseUrl}/posts/`, `${baseUrl}/housing/`);
        }
        if (currentUrl.includes(`${baseUrl}/housing/`)) {
            return currentUrl.replace(`${baseUrl}/housing/`, `${baseUrl}/posts/`);
        }

        return null;
    }

    private cleanAndResolve(url: string, fallback: string, context: 'post' | 'housing' = 'post'): string {
        if (!url) return fallback;

        // 1. If already absolute or data URL, return as is
        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('data:')) {
            return url;
        }

        // 2. Clean up the URL
        let cleanUrl = url.replace(/^@local:\/+/i, '') // Handle @local:// and @local:/
            .replace(/^@local:/i, '')    // Handle @local:
            .trim();

        // Remove any leading/trailing slashes
        cleanUrl = cleanUrl.replace(/^\/+|\/+$/g, '');

        if (!cleanUrl) return fallback;

        const lowerUrl = cleanUrl.toLowerCase();

        // 3. If it already has a known folder prefix, resolve to base URL
        if (lowerUrl.startsWith('posts/') || lowerUrl.startsWith('housing/') || lowerUrl.startsWith('avatars/')) {
            return `${this.baseApiUrl}/${cleanUrl}`;
        }

        // 4. Context-specific defaults
        if (context === 'housing') {
            // For housing, we check if it's a direct filename
            if (!cleanUrl.includes('/')) {
                // User explicitly said housing media are in 'housing' folder
                return `${this.baseApiUrl}/housing/${cleanUrl}`;
            }
            return `${this.baseApiUrl}/housing/${cleanUrl}`;
        }

        // 5. Default to posts folder for everything else
        return `${this.baseApiUrl}/posts/${cleanUrl}`;
    }

    private cleanAndResolveAvatar(url: string, fallback: string): string {
        if (!url) return fallback;

        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('data:')) {
            return url;
        }

        let cleanUrl = url.replace(/^@local:\/+/i, '')
            .replace(/^@local:/i, '')
            .trim();
        cleanUrl = cleanUrl.replace(/^\/+|\/+$/g, '');

        if (!cleanUrl) return fallback;

        const lowerUrl = cleanUrl.toLowerCase();

        if (lowerUrl.startsWith('avatars/')) {
            return `${this.baseApiUrl}/${cleanUrl}`;
        }

        if (cleanUrl.includes('/')) {
            return `${this.baseApiUrl}/${cleanUrl}`;
        }

        return `${this.baseApiUrl}/avatars/${cleanUrl}`;
    }
}
