import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityComponent } from './create-community';

describe('CreateCommunity', () => {
  let component: CreateCommunityComponent;
  let fixture: ComponentFixture<CreateCommunityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCommunityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCommunityComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
