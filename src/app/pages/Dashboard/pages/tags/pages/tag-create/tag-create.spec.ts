import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagCreate } from './tag-create';

describe('TagCreate', () => {
  let component: TagCreate;
  let fixture: ComponentFixture<TagCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
