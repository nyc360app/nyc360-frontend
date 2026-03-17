import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobProfile } from './job-profile';

describe('JobProfile', () => {
  let component: JobProfile;
  let fixture: ComponentFixture<JobProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
