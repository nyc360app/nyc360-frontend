import { TestBed } from '@angular/core/testing';

import { CreateOffer } from './create-offer';

describe('CreateOffer', () => {
  let service: CreateOffer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateOffer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
