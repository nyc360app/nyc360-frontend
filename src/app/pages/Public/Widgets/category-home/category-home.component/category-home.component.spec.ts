import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryHomeComponent } from './category-home.component';

describe('CategoryHomeComponent', () => {
  let component: CategoryHomeComponent;
  let fixture: ComponentFixture<CategoryHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryHomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
