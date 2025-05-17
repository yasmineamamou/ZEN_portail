import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray } from '@angular/forms';
import { EvaluationService } from '../../services/evaluation.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-evaluation-question',
  standalone: true,
  imports: [FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule, MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule, CommonModule, ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,],
  templateUrl: './evaluation-question.component.html',
  styleUrl: './evaluation-question.component.css'
})
export class EvaluationQuestionComponent {
  evaluationId!: number;
  evaluationTitle = '';
  evaluationDescription = '';
  evaluationDuration = 0;

  questionFormArray!: FormArray;

  questionList: any[] = [
    {
      texte: '',
      description: '',
      points: 1,

      options: [
        { texte: '', is_correct: false },
        { texte: '', is_correct: false }
      ]
    }
  ];
  evaluationtype_question = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private evalService: EvaluationService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Route param ID =', idParam); // Add this line

    if (idParam && !isNaN(+idParam)) {
      this.evaluationId = +idParam;
      console.log('✅ evaluationId set to:', this.evaluationId);
    } else {
      console.error('❌ Invalid evaluation ID in route');
    }
    this.loadEvaluation();
  }
  loadEvaluation(): void {
    this.evalService.getEvaluationById(this.evaluationId).subscribe(data => {
      this.evaluationTitle = data.evaluation.titre;
      this.evaluationDescription = data.formations
        .map((f: any) => f.description)
        .filter((desc: any) => !!desc) // Remove undefined/null/empty
        .join(', ');
      this.evaluationDuration = data.evaluation.duree;
      this.evaluationtype_question = data.evaluation.type_question;
    });
  }
  initForm() {
    this.questionFormArray = this.fb.array([]);
  }

  addOption(questionIndex: number) {
    const options = this.getOptionsArray(questionIndex);
    options.push(this.fb.group({
      texte: ['', Validators.required],
      is_correct: [false]
    }));
  }

  getOptionsArray(index: number): FormArray {
    return this.questionFormArray.at(index).get('options') as FormArray;
  }
  submitQuestions(): void {
    console.log('📤 Submitting questions for evaluationId:', this.evaluationId);

    this.evalService.getEvaluationById(this.evaluationId).subscribe({
      next: (evaluation: any) => {
        this.evaluationtype_question = evaluation.evaluation.type_question;

        this.questionList.forEach((q, index) => {
          const payload = {
            evaluation_id: this.evaluationId,
            texte: q.texte,
            description: q.description,
            points: q.points || 1,
            ordre: index + 1
          };

          console.log('📦 Sending payload:', payload);

          this.evalService.createQuestion(payload).subscribe({
            next: (res: any) => {
              const questionId = res?.id;
              console.log('✅ Question created with ID:', questionId);

              if (this.evaluationtype_question !== 'TEXT') {
                q.options.forEach((opt: any) => {
                  this.evalService.createOption({ question_id: questionId, ...opt }).subscribe();
                });
              }
              if (index === this.questionList.length - 1) {
                alert('✅ Questions enregistrées avec succès !');
              }
            },
            error: (err) => {
              console.error('❌ Error creating question:', err);
            }

          });
        });
      },
      error: (err) => {
        console.error('❌ Failed to fetch evaluation:', err);
        alert('Impossible de récupérer les détails de l\'évaluation.');
      }
    });
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C...
  }
  addQuestion(): void {
    this.questionList.push({
      texte: '',
      description: '',

      points: 0,
      options: [],
      ordre: 0
    });
  }
  addOptionToQuestion(qIndex: number): void {
    this.questionList[qIndex].options.push({
      texte: '',
      is_correct: false,
    });
  }

}
