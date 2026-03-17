import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagUpdate } from './tag-update';

describe('TagUpdate', () => {
  let component: TagUpdate;
  let fixture: ComponentFixture<TagUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
