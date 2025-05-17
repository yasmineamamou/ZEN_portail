import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationQuestionComponent } from './evaluation-question.component';

describe('EvaluationQuestionComponent', () => {
  let component: EvaluationQuestionComponent;
  let fixture: ComponentFixture<EvaluationQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationQuestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
