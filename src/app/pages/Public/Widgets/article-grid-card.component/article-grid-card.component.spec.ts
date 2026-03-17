import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleGridCardComponent } from './article-grid-card.component';

describe('ArticleGridCardComponent', () => {
  let component: ArticleGridCardComponent;
  let fixture: ComponentFixture<ArticleGridCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleGridCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticleGridCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
