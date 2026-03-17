import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InitiativesLayoutComponent } from './initiatives-layout/initiatives-layout';
import { CATEGORY_THEMES } from '../feeds/models/categories';

const initiativeRoutes: Routes = Object.keys(CATEGORY_THEMES).map(key => {
  const catId = Number(key);
  const config = (CATEGORY_THEMES as any)[catId];

  return {
    path: config.path, // e.g., 'health', 'community'
    component: InitiativesLayoutComponent,
    data: {
      categoryEnum: catId,
      themeColor: config.color,
      title: config.label
    }
  };
});

// Define final routes with the redirect included at the start
const routes: Routes = [
  { path: '', redirectTo: '/public/home', pathMatch: 'full' },
  ...initiativeRoutes
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InitiativesRoutingModule { }