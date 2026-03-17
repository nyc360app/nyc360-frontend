import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CATEGORY_THEMES } from '../pages/Public/Widgets/feeds/models/categories';
import { FeedLayoutComponent } from '../pages/Public/Widgets/feeds/feed-layout/feed-layout';

const routes: Routes = Object.keys(CATEGORY_THEMES).map(key => {
  const catId = Number(key); 
  
  // التعديل هنا 👇
  const config = (CATEGORY_THEMES as any)[catId];

  return {
    path: config.path, 
    component: FeedLayoutComponent,
    data: {
      categoryEnum: catId,    
      themeColor: config.color, 
      title: config.label     
    }
  };
});

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostsRoutingModule { }