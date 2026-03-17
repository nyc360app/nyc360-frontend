import { TestBed } from '@angular/core/testing';

import { Rss } from './rss';

describe('Rss', () => {
  let service: Rss;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rss);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
