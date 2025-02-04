import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionUnitesComponent } from './gestion-unites.component';

describe('GestionUnitesComponent', () => {
  let component: GestionUnitesComponent;
  let fixture: ComponentFixture<GestionUnitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionUnitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionUnitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
