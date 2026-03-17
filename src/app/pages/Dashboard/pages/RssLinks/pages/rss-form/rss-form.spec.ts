import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RssForm } from './rss-form';

describe('RssForm', () => {
  let component: RssForm;
  let fixture: ComponentFixture<RssForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RssForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RssForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
