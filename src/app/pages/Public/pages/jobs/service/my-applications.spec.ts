import { TestBed } from '@angular/core/testing';

import { MyApplications } from './my-applications';

describe('MyApplications', () => {
  let service: MyApplications;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyApplications);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
