import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.scss']
})
export class AboutUsComponent implements OnInit, AfterViewInit {

  private platformId = inject(PLATFORM_ID);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit() {
    this.updateSeoTags();
  }

  updateSeoTags() {
    this.titleService.setTitle('About NYC360 - Our Mission, Vision & Values');
    this.metaService.updateTag({ name: 'description', content: 'Learn more about NYC360, our mission to connect New Yorkers, and our vision for the digital future of the city.' });
    this.metaService.updateTag({ name: 'keywords', content: 'NYC360 About, NYC360 Mission, NYC360 Team, New York Neighborhoods, Community Platform' });
  }

  // The 12 Organizational Pillars
  // Note: Colors are removed here to enforce a unified professional theme in CSS
  pillars = [
    { name: 'NYC360', icon: 'bi-globe', desc: 'The ultimate digital hub for New York City.', link: '/' },
    { name: 'Story', icon: 'bi-book', desc: 'Our journey from a concept to a movement.', link: '/story' },
    { name: 'Mission', icon: 'bi-bullseye', desc: 'Empowering voices and connecting communities.', link: '/mission' },
    { name: 'Vision', icon: 'bi-eye', desc: 'Redefining the digital future of urban living.', link: '/vision' },
    { name: 'Values', icon: 'bi-heart', desc: 'Integrity, authenticity, and inclusivity.', link: '/values' },
    { name: 'Strategy', icon: 'bi-bar-chart', desc: 'Innovation-driven growth and engagement.', link: '/strategy' },
    { name: 'Partners', icon: 'bi-people', desc: 'Collaborating with city leaders and brands.', link: '/partners' },
    { name: 'Career', icon: 'bi-briefcase', desc: 'Join the team shaping the narrative.', link: '/careers' },
    { name: 'Membership', icon: 'bi-card-heading', desc: 'Exclusive access to the city’s pulse.', link: '/membership' },
    { name: 'Governance', icon: 'bi-bank', desc: 'Transparency, ethics, and standards.', link: '/governance' },
    { name: 'Our Team', icon: 'bi-person-badge', desc: 'The visionaries behind the platform.', link: '/team' },
    { name: 'Contact Us', icon: 'bi-envelope', desc: 'Let’s start a conversation.', link: '/contact' }
  ];

  @ViewChildren('animateItem') animateItems!: QueryList<ElementRef>;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Trigger slightly earlier for smoother mobile feel
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, options);

    this.animateItems.forEach(item => {
      observer.observe(item.nativeElement);
    });
  }
}