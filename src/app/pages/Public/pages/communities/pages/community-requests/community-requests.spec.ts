import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityRequests } from './community-requests';

describe('CommunityRequests', () => {
  let component: CommunityRequests;
  let fixture: ComponentFixture<CommunityRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
