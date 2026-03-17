import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionFeed } from './profession-feed';

describe('ProfessionFeed', () => {
  let component: ProfessionFeed;
  let fixture: ComponentFixture<ProfessionFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionFeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfessionFeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
