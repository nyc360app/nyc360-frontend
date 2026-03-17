import { TestBed } from '@angular/core/testing';

import { CommunityPostService } from './community-post';

describe('CommunityPost', () => {
  let service: CommunityPostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityPostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
