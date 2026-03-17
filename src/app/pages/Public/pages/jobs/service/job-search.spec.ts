import { TestBed } from '@angular/core/testing';

import { JobSearch } from './job-search';

describe('JobSearch', () => {
  let service: JobSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobSearch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
