import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationControlsComponent } from './navigation-controls.component';

describe('NavigationControlsComponent', () => {
  let component: NavigationControlsComponent;
  let fixture: ComponentFixture<NavigationControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
