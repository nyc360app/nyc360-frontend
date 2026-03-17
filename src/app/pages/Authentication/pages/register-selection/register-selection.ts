// src/app/pages/Authentication/pages/register-selection/register-selection.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { trigger, style, animate, transition, query, stagger } from '@angular/animations';


@Component({
  selector: 'app-register-selection',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-selection.html',
  styleUrls: ['./register-selection.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, scale: 0.9, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('0.7s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, scale: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class RegisterSelectionComponent {
  private router = inject(Router);

  selectionOptions = [
    {
      id: 'new-yorker',
      title: 'New Yorker',
      icon: 'bi-houses-fill',
      desc: 'Residents & locals looking to connect with their neighborhood.',
      theme: 'newyorker',
      color: '#BC5E3D'
    },
    {
      id: 'business',
      title: 'Business',
      icon: 'bi-shop-window',
      desc: 'Empower your local business with direct community engagement.',
      theme: 'business',
      color: '#6366F1'
    },
    {
      id: 'organization',
      title: 'Organization',
      icon: 'bi-building-fill-check',
      desc: 'Civic partners, non-profits, and official city institutions.',
      theme: 'organization',
      color: '#10B981'
    },
    {
      id: 'visitor',
      title: 'Visitor',
      icon: 'bi-airplane-fill',
      desc: 'Exploring NYC? Get personalized guides and city essentials.',
      theme: 'visitor',
      color: '#F59E0B'
    }
  ];

  onSelect(typeId: string) {
    switch (typeId) {
      case 'new-yorker': this.router.navigate(['/auth/register/newyorker']); break;
      case 'visitor': this.router.navigate(['/auth/register/visitor']); break;
      case 'business': this.router.navigate(['/auth/register/business']); break;
      case 'organization': this.router.navigate(['/auth/register/organization']); break;
    }
  }
}