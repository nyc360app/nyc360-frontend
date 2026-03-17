import { TestBed } from '@angular/core/testing';

import { MyOffers } from './my-offers';

describe('MyOffers', () => {
  let service: MyOffers;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyOffers);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
