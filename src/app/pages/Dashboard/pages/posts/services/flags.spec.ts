import { TestBed } from '@angular/core/testing';

import { Flags } from './flags';

describe('Flags', () => {
  let service: Flags;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Flags);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
