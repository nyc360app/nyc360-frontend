import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from "../../Public/Widgets/nav-bar/nav-bar.component";
import { FooterComponent } from "../../Public/Widgets/footer/footer.component";
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component";

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, FooterComponent, CommonModule, BreadcrumbsComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {
}
