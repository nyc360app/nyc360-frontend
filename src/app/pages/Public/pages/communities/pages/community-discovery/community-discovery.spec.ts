import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityDiscovery } from './community-discovery';

describe('CommunityDiscovery', () => {
  let component: CommunityDiscovery;
  let fixture: ComponentFixture<CommunityDiscovery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityDiscovery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityDiscovery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
