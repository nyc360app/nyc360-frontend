import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagPosts } from './tag-posts';

describe('TagPosts', () => {
  let component: TagPosts;
  let fixture: ComponentFixture<TagPosts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagPosts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagPosts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
