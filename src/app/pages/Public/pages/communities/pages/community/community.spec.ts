import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityComponent } from './community';

describe('Community', () => {
  let component: CommunityComponent;
  let fixture: ComponentFixture<CommunityComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
