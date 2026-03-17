import { TestBed } from '@angular/core/testing';

import { ProfessionFeed } from './profession-feed';

describe('ProfessionFeed', () => {
  let service: ProfessionFeed;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfessionFeed);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
