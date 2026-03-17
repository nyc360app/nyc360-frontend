import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-article-grid-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ImgFallbackDirective],
  templateUrl: './article-grid-card.component.html',
  styleUrls: ['./article-grid-card.component.scss']
})
export class ArticleGridCardComponent {
  @Input() image: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() link: any; // يقبل Array لـ routerLink
  @Input() customColor: string = '#00695C';
}