import { TestBed } from '@angular/core/testing';

import { Createcommunty } from './createcommunty';

describe('Createcommunty', () => {
  let service: Createcommunty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Createcommunty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
