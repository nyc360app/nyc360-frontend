import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RssList } from './rss-list';

describe('RssList', () => {
  let component: RssList;
  let fixture: ComponentFixture<RssList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RssList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RssList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
