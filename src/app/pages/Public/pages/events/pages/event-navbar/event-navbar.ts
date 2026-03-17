import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-event-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="event-nav shadow-sm">
      <div class="container d-flex justify-content-between align-items-center">
        <div class="nav-center">
          <div class="event-tabs">
            <a routerLink="/public/events/home" routerLinkActive="active" class="event-tab-link">
              <i class="bi bi-house-door"></i> Home
            </a>
            <a routerLink="/public/events/list" routerLinkActive="active" class="event-tab-link">
              <i class="bi bi-rss"></i> Event Feed
            </a>
            <!-- <a routerLink="/public/events/my-tickets" routerLinkActive="active" class="event-tab-link">
              <i class="bi bi-ticket-perforated"></i> My Tickets
            </a> -->
          </div>
        </div>

        <div class="nav-right">
          <button routerLink="/public/events/create" class="btn-create-event">
            <i class="bi bi-plus-circle-fill"></i> Create Event
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .event-nav {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(15px);
      padding: 10px 0;
      position: sticky;
      top: 110px; /* Adjusted for global navbar */
      z-index: 999;
      border-bottom: 1px solid rgba(155, 89, 182, 0.1);

      .event-tabs {
        display: flex;
        background: #fdfafd;
        padding: 4px;
        border-radius: 50px;
        gap: 5px;
        border: 1px solid rgba(155, 89, 182, 0.05);

        .event-tab-link {
          padding: 8px 24px;
          border-radius: 50px;
          text-decoration: none;
          color: #777;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;

          &.active {
            background: #9b59b6;
            color: #fff;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.25);
          }

          &:hover:not(.active) {
            background: rgba(155, 89, 182, 0.08);
            color: #9b59b6;
          }
        }
      }

      .btn-create-event {
        background: #9b59b6;
        color: #fff;
        border: none;
        padding: 9px 22px;
        border-radius: 12px;
        font-weight: 750;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.3s;
        &:hover {
          background: #8e44ad;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(155, 89, 182, 0.3);
        }
      }

      @media (max-width: 991px) {
        top: 65px; /* Adjust for mobile global nav */
        .nav-center { order: 3; width: 100%; margin-top: 12px; }
        .nav-center .event-tabs { justify-content: center; }
        .container { flex-wrap: wrap; justify-content: center !important; }
        .nav-right { width: 100%; display: flex; justify-content: center; margin-top: 10px; }
      }
    }
  `]
})
export class EventNavbarComponent { }
