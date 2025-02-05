import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCubesComponent } from './gestion-cubes.component';

describe('GestionCubesComponent', () => {
  let component: GestionCubesComponent;
  let fixture: ComponentFixture<GestionCubesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCubesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCubesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
