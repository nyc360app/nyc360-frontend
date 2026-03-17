import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityPost } from './create-community-post';

describe('CreateCommunityPost', () => {
  let component: CreateCommunityPost;
  let fixture: ComponentFixture<CreateCommunityPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCommunityPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCommunityPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
