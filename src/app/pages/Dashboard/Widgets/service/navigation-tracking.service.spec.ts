import { TestBed } from '@angular/core/testing';

import { NavigationTrackingService } from './navigation-tracking.service';

describe('NavigationTrackingService', () => {
  let service: NavigationTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
