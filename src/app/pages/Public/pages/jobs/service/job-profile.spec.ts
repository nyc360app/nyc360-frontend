import { TestBed } from '@angular/core/testing';

import { JobProfile } from './job-profile';

describe('JobProfile', () => {
  let service: JobProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
