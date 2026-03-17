import { Directive, Input, ElementRef, HostListener, inject } from '@angular/core';
import { ImageService } from '../services/image.service';

@Directive({
    selector: 'img[appImgFallback]',
    standalone: true
})
export class ImgFallbackDirective {
    @Input() appImgFallback: 'post' | 'avatar' | 'housing' | string = 'post';

    private el = inject(ElementRef);
    private imageService = inject(ImageService);
    private isFallbackApplied = false;

    private isAlternativeTried = false;

    @HostListener('error')
    onError() {
        const img: HTMLImageElement = this.el.nativeElement;

        // Stage 1: Try alternative path (housing/posts toggle)
        if (!this.isAlternativeTried) {
            this.isAlternativeTried = true;
            const alt = this.imageService.getAlternativeUrl(img.src);
            if (alt) {
                img.src = alt;
                return;
            }
        }

        // Stage 2: Final fallback or hide
        if (this.isFallbackApplied) return;
        this.isFallbackApplied = true;

        const fallback = this.getFallbackUrl();
        if (!fallback) {
            img.style.display = 'none';
        } else {
            img.src = fallback;
        }
    }

    private getFallbackUrl(): string {
        if (this.appImgFallback === 'avatar') return this.imageService.DEFAULT_AVATAR;
        if (this.appImgFallback === 'housing') return this.imageService.DEFAULT_HOUSING;
        if (this.appImgFallback === 'post') return this.imageService.DEFAULT_POST;
        if (this.appImgFallback && typeof this.appImgFallback === 'string') return this.appImgFallback;
        return this.imageService.PLACEHOLDER;
    }
}
