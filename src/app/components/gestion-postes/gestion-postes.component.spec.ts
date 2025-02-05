import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPostesComponent } from './gestion-postes.component';

describe('GestionPostesComponent', () => {
  let component: GestionPostesComponent;
  let fixture: ComponentFixture<GestionPostesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPostesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPostesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
