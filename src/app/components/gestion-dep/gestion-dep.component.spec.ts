import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDepComponent } from './gestion-dep.component';

describe('GestionDepComponent', () => {
  let component: GestionDepComponent;
  let fixture: ComponentFixture<GestionDepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionDepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionDepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
