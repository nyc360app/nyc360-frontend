import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-initials-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './initials-avatar.component.html',
  styleUrls: ['./initials-avatar.component.scss']
})
export class InitialsAvatarComponent implements OnChanges {
  @Input() name: string | null | undefined = '';
  @Input() src: string | null | undefined = '';
  @Input() alt: string | null | undefined = '';

  private imageService = inject(ImageService);

  protected imageFailed = false;

  private readonly palettes = [
    { bg: '#fee2e2', fg: '#991b1b' },
    { bg: '#ffedd5', fg: '#9a3412' },
    { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#dcfce7', fg: '#166534' },
    { bg: '#dbeafe', fg: '#1d4ed8' },
    { bg: '#ede9fe', fg: '#6d28d9' },
    { bg: '#fce7f3', fg: '#9d174d' },
    { bg: '#e0f2fe', fg: '#0f766e' }
  ];

  ngOnChanges(): void {
    this.imageFailed = false;
  }

  protected onImageError(): void {
    this.imageFailed = true;
  }

  protected get resolvedSrc(): string {
    if (!this.src || !this.src.trim() || this.imageFailed) return '';
    return this.imageService.resolveImageUrl(this.src, 'avatar');
  }

  protected get initials(): string {
    const rawName = (this.name || '').trim();
    if (!rawName) return 'NY';

    const parts = rawName
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    }

    return rawName.slice(0, 2).toUpperCase();
  }

  protected get avatarTone(): { bg: string; fg: string } {
    const seed = (this.name || this.initials)
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0);

    return this.palettes[seed % this.palettes.length];
  }

  protected get altText(): string {
    return (this.alt || this.name || 'Avatar').trim();
  }
}