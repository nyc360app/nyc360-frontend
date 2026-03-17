import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSearchComponent } from './job-search';

describe('JobSearch', () => {
  let component: JobSearchComponent;
  let fixture: ComponentFixture<JobSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobSearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
