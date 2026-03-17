import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../services/loader-service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loaderService.isLoading$ | async" class="loader-overlay">
      <div class="logo-loader">
        <svg viewBox="0 0 400 150" class="nyc-logo-svg">
          <!-- NYC Text - Blue Paths -->
          <g class="nyc-group">
            <path class="letter-n" d="M 40,100 V 60 c 0,-20 30,-20 30,0 v 40" />
            <path class="letter-y" d="M 80,60 v 40 c 0,20 -30,20 -30,30 c 0,10 12,12 20,4" />
            <path class="letter-c" d="M 140,65 c -5,-7 -15,-10 -25,-10 -15,0 -25,10 -25,25 0,15 10,25 25,25 10,0 20,-3 25,-10" />
          </g>

          <!-- 360 Text - Orange Paths -->
          <g class="group-360">
            <!-- 3 -->
            <path class="char-3" d="M 160,60 c 20,-5 30,5 20,15 c 10,0 20,10 10,25 c -10,10 -25,5 -25,5" />
            <!-- 6 -->
            <path class="char-6" d="M 225,60 c -15,0 -25,10 -25,25 c 0,15 10,15 25,15 c 15,0 25,-10 25,-20 c 0,-10 -10,-20 -25,-20" />
            <!-- 0 -->
            <path class="char-0" d="M 265,80 c 0,-25 20,-25 20,0 c 0,25 -20,25 -20,0 Z" />
          </g>
          
          <!-- Orange Swoosh -->
          <path class="swoosh" d="M 20,75 Q 40,115 100,55" />
        </svg>
      </div>
      <div class="loading-bar-container">
        <div class="loading-bar"></div>
      </div>
      <div class="writing-status">NYC360 is Loading...</div>
    </div>
  `,
  styleUrls: ['./loader.scss']
})
export class LoaderComponent {
  loaderService = inject(LoaderService);
}