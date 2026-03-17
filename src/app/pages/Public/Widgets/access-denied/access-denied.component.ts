import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-access-denied',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './access-denied.component.html',
    styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent { }
