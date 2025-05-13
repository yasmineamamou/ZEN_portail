import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { EvaluationService } from '../../services/evaluation.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-evaluation',
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule, MatFormFieldModule,
    MatTableModule, MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,],
  templateUrl: './evaluation.component.html',
  styleUrl: './evaluation.component.css'
})
export class EvaluationComponent implements OnInit {
  evaluationForm!: FormGroup;
  formations: any[] = [];
  departements: any[] = [];
  evaluations: any[] = [];
  showParentSelector = false;
  openEvalMenus: { [key: number]: boolean } = {};
  filteredEvaluations: any[] = [];
  selectedDepartement: string = '';
  searchTerm: string = '';
  showAddEvaluationForm = false;
  selectedFormations: number[] = [];
  selectedDepartements: number[] = [];
  showFormationDropdown = false;
  showDepartementDropdown = false;
  showTypeDropdown = false;
  filteredTypesList: string[] = [];
  showEvaluationTypeDropdown = false;
  filteredEvaluationTypes: string[] = [];
  typeOptions: string[] = [];
  filteredTypes!: Observable<string[]>;
  selectedType: string = '';

  constructor(private fb: FormBuilder, private evalService: EvaluationService, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadEvaluations();
    this.evaluationForm = this.fb.group({
      titre: ['', Validators.required],
      type_evaluation: ['', Validators.required],
      type_question: ['', Validators.required],
      duree: ['', Validators.required],
      autre_test: [false],
      parent_evaluation_id: [null],
      formation_ids: [[]],
      departement_ids: [[]],
      questions: this.fb.array([])
    });

    this.loadTypeOptions();

    this.filteredTypes = this.evaluationForm.get('type_evaluation')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTypes(value || ''))
    );
    this.evaluationForm.get('autre_test')?.valueChanges.subscribe(value => {
      this.showParentSelector = value;
      if (!value) {
        this.evaluationForm.get('parent_evaluation_id')?.setValue(null);
      }
    });
  }

  loadDropdowns() {
    this.evalService.getFormations().subscribe(data => this.formations = data as any[]);
    this.evalService.getDepartements().subscribe(data => this.departements = data as any[]);
    this.evalService.getEvaluations().subscribe(data => this.evaluations = data as any[]);
  }


  get questions(): FormArray {
    return this.evaluationForm.get('questions') as FormArray;
  }

  addQuestion() {
    this.questions.push(this.fb.group({
      texte: ['', Validators.required],
      description: [''],
      type_question: ['QCM', Validators.required],
      options: this.fb.array([])
    }));
  }

  addOption(questionIndex: number) {
    const options = this.questions.at(questionIndex).get('options') as FormArray;
    options.push(this.fb.group({
      texte: ['', Validators.required],
      is_correct: [false]
    }));
  }

  onSubmit() {
    console.log("🚀 Submit clicked", this.evaluationForm.value); // <-- debug
    if (this.evaluationForm.valid) {
      const formValue = this.evaluationForm.value;
      formValue.parent_evaluation_id = formValue.autre_test ? formValue.parent_evaluation_id : null;
      this.evalService.createEvaluation(formValue).subscribe({
        next: () => alert('✅ Evaluation créée !'),
        error: err => console.error('Error creating evaluation', err)
      });
    } else {
      console.warn("⚠️ Form invalid", this.evaluationForm.errors);
    }
  }

  getOptionsArray(questionGroup: AbstractControl): FormArray {
    return questionGroup.get('options') as FormArray;
  }
  loadEvaluations(): void {
    this.evalService.getEvaluations().subscribe((data: any[]) => {
      this.evaluations = data;
      console.log("✅ Evaluations loaded:", this.evaluations);
    });
  }

  toggleEvaluationMenu(id: number): void {
    this.openEvalMenus = { [id]: !this.openEvalMenus[id] };
  }

  onEditEvaluation(evaluation: any): void {
    console.log('✏️ Edit:', evaluation);
    // implement your logic here
  }

  onDeleteEvaluation(id: number): void {
    if (confirm("Supprimer cette évaluation ?")) {
      this.evalService.deleteEvaluation(id).subscribe(() => {
        alert("✅ Supprimée");
        this.loadEvaluations();
      });
    }
  }

  onSendEvaluation(evaluation: any): void {
    console.log('📤 Send:', evaluation);
    // implement your logic here
  }

  openEvaluationFile(evaluation: any): void {
    const fileUrl = `http://localhost:3000/secure-evaluation/${evaluation.id}`;
    window.open(fileUrl, '_blank');
  }

  previewEvaluationFile(evaluation: any): void {
    // Optional: implement preview logic like PDF/image/video preview
    this.openEvaluationFile(evaluation); // fallback
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDepartementFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.evaluations;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.titre.toLowerCase().includes(term) || e.file_type.toLowerCase().includes(term)
      );
    }

    if (this.selectedDepartement) {
      filtered = filtered.filter(e => String(e.departement_id) === this.selectedDepartement);
    }

    this.filteredEvaluations = filtered;
  }
  toggleFormationDropdown() {
    this.showFormationDropdown = !this.showFormationDropdown;
  }

  toggleDepartementDropdown() {
    this.showDepartementDropdown = !this.showDepartementDropdown;
  }

  onFormationCheckChange(id: number) {
    const current = this.selectedFormations;
    this.selectedFormations = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];

    this.evaluationForm.patchValue({ formation_ids: this.selectedFormations });
  }

  onDepartementCheckChange(id: number) {
    const current = this.selectedDepartements;
    this.selectedDepartements = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];

    this.evaluationForm.patchValue({ departement_ids: this.selectedDepartements });
  }

  loadTypeOptions() {
    this.evalService.getEvaluationTypes().subscribe((types: string[]) => {
      this.typeOptions = types;
    });
  }

  private _filterTypes(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.typeOptions.filter(option => option.toLowerCase().includes(filterValue));
  }


  onTypeInput(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredTypesList = this.typeOptions.filter(option =>
      option.toLowerCase().includes(value)
    );
    this.evaluationForm.get('type_question')?.setValue(event.target.value);
    this.showTypeDropdown = true;
  }

  onEvaluationTypeInput(event: any) {
    const inputValue = event.target.value.toLowerCase();
    this.filteredEvaluationTypes = this.typeOptions.filter(option =>
      option.toLowerCase().includes(inputValue)
    );
    this.evaluationForm.get('type_evaluation')?.setValue(event.target.value);
    this.showEvaluationTypeDropdown = true;
  }

  selectEvaluationType(option: string) {
    this.evaluationForm.get('type_evaluation')?.setValue(option);
    this.showEvaluationTypeDropdown = false;
  }

  onBlurEvaluationType() {
    const value = this.evaluationForm.get('type_evaluation')?.value?.trim();
    if (value && !this.typeOptions.includes(value)) {
      this.evalService.addEvaluationType(value).subscribe(() => {
        this.typeOptions.push(value);
      });
    }
    setTimeout(() => this.showEvaluationTypeDropdown = false, 200); // allow click
  }
}
