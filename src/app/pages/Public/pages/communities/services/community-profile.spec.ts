import { TestBed } from '@angular/core/testing';

import { CommunityProfile } from './community-profile';

describe('CommunityProfile', () => {
  let service: CommunityProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
