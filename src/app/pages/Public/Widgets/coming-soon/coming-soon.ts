import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coming-soon.html',
  styleUrls: ['./coming-soon.scss']
})
export class ComingSoonComponent implements OnInit, OnDestroy {

  // Target Launch Date (e.g., 14 days from now)
  launchDate: Date = new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000));

  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  private intervalId: any;
  email: string = '';
  isSubscribed: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    this.calculateTime();
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        this.calculateTime();
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  calculateTime() {
    const now = new Date().getTime();
    const distance = this.launchDate.getTime() - now;

    if (distance < 0) {
      // Launch time reached
      this.days = 0; this.hours = 0; this.minutes = 0; this.seconds = 0;
      clearInterval(this.intervalId);
    } else {
      this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    }
  }

  onNotify() {
    if (this.email) {
      // Here you would call your API to save the email
      this.isSubscribed = true;
      setTimeout(() => this.isSubscribed = false, 3000); // Reset after 3 sec
      this.email = '';
    }
  }
}