import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mycommunities } from './mycommunities';

describe('Mycommunities', () => {
  let component: Mycommunities;
  let fixture: ComponentFixture<Mycommunities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mycommunities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mycommunities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
