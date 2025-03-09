import { Component, ViewChild } from '@angular/core';
import { ModuleService } from '../../services/module.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-module',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatRadioModule
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css'
})
export class ModuleComponent {
  displayedColumns: string[] = ['nom', 'description'];
  dataSource = new MatTableDataSource<any>([]);
  showAddModuleForm = false;
  showEditModuleForm = false;
  isEditMode = false;

  newModule = { nom: '', description: '' };
  selectedModule: any = { id: null, nom: '', description: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private moduleService: ModuleService, private http: HttpClient) { }

  ngOnInit() {
    this.loadModules();
  }

  loadModules() {
    this.moduleService.getModules().subscribe(data => {
      console.log('Loaded Modules:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  openAddModuleForm() {
    this.showAddModuleForm = true;
    this.newModule = { nom: '', description: '' };
  }

  closeAddModuleForm() {
    this.showAddModuleForm = false;
  }

  openEditModuleForm(module: any) {
    if (!module || !module.id) {
      console.error('Error: Module ID is missing!', module);
      return;
    }

    this.selectedModule = { ...module };
    console.log('Editing Module:', this.selectedModule); // ✅ Log to confirm the ID exists
    this.showEditModuleForm = true;
  }


  closeEditModuleForm() {
    this.showEditModuleForm = false;
  }

  onAddModule() {

    this.moduleService.addModule(this.newModule).subscribe(() => {
      this.loadModules();
      this.showAddModuleForm = false;
    });
  }

  onEditModule() {
    if (!this.selectedModule.nom.trim()) {
      alert('Le nom de la module est requis.');
      return;
    }

    console.log('Updating module:', this.selectedModule); // ✅ Debugging Log

    this.moduleService.updateModule(this.selectedModule.id, this.selectedModule)
      .subscribe(
        response => {
          console.log('module Updated Successfully:', response); // ✅ Success Log
          this.loadModules();
          this.showEditModuleForm = false;
        },
        error => {
          console.error('Edit Error:', error); // ✅ Log error response
        }
      );
  }
  deleteModule(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette module ?')) {
      this.moduleService.deleteModule(id).subscribe(() => this.loadModules());
    }
  }
}