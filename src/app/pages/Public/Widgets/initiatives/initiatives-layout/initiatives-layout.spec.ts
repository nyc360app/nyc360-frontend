import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitiativesLayout } from './initiatives-layout';

describe('InitiativesLayout', () => {
  let component: InitiativesLayout;
  let fixture: ComponentFixture<InitiativesLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitiativesLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitiativesLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
