import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagsList } from './flags-list';

describe('FlagsList', () => {
  let component: FlagsList;
  let fixture: ComponentFixture<FlagsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlagsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlagsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
