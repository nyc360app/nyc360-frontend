import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../Authentication/Service/auth';

@Component({
    selector: 'app-agent-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterOutlet],
    templateUrl: './agent-dashboard.html',
    styleUrls: ['./agent-dashboard.scss']
})
export class AgentDashboardComponent implements OnInit {
    public authService = inject(AuthService);

    ngOnInit() {
    }
}
