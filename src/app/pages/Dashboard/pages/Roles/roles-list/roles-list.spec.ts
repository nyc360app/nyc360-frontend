import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesListComponent } from './roles-list';

describe('RolesList', () => {
  let component: RolesListComponent;
  let fixture: ComponentFixture<RolesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
