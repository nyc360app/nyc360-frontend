import { TestBed } from '@angular/core/testing';

import { Mycommunities } from './mycommunities';

describe('Mycommunities', () => {
  let service: Mycommunities;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mycommunities);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
