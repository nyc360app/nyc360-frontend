import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsListComponent } from './tags-list';

describe('TagsList', () => {
  let component: TagsListComponent;
  let fixture: ComponentFixture<TagsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
