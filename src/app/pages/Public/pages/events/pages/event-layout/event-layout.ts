import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EventNavbarComponent } from '../event-navbar/event-navbar';

@Component({
    selector: 'app-event-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, EventNavbarComponent],
    template: `
    <div class="event-layout-wrapper">
      <br>
      
      <app-event-navbar></app-event-navbar>
      <main class="event-main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .event-layout-wrapper {
      min-height: 100vh;
      background-color: #fff;
    }
    .event-main-content {
      padding-top: 0;
    }
  `]
})
export class EventLayoutComponent { }
