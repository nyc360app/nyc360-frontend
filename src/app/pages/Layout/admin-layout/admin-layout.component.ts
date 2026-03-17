import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../Dashboard/Widgets/sidebar/sidebar.component";
import { ToastComponent } from "../../../shared/components/toast/toast.component";
import { NavigationControlsComponent } from "../../Dashboard/Widgets/navigation-controls/navigation-controls.component";

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, CommonModule, SidebarComponent, ToastComponent, NavigationControlsComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
}
