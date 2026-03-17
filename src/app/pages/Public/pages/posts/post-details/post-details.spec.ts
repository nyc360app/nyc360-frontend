import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostDetailsComponent } from './post-details';

describe('PostDetails', () => {
  let component: PostDetailsComponent;
  let fixture: ComponentFixture<PostDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
