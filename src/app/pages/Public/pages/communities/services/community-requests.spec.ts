import { TestBed } from '@angular/core/testing';

import { CommunityRequestsService } from './community-requests';

describe('CommunityRequests', () => {
  let service: CommunityRequestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityRequestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
