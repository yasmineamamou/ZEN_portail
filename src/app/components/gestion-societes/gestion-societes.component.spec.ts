import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionSocietesComponent } from './gestion-societes.component';

describe('GestionSocietesComponent', () => {
  let component: GestionSocietesComponent;
  let fixture: ComponentFixture<GestionSocietesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionSocietesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionSocietesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
