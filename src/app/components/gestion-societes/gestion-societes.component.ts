import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSortModule } from '@angular/material/sort';
@Component({
  selector: 'app-gestion-societes',
  imports: [FormsModule,
    CommonModule,
    MatTableModule,
    MatPaginator,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSort,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatRadioModule,

  ],
  standalone: true,
  templateUrl: './gestion-societes.component.html',
  styleUrl: './gestion-societes.component.css'
})
export class GestionSocietesComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description'];
  societes: any[] = [];
  showModal = false;
  isEditMode = false;
  selectedSociete: any = { nom: '', description: '' };
  societeName = '';
  dataSource = new MatTableDataSource<any>([]);
  showSocieteForm = false;
  showAddSocieteForm = false;
  showEditSocieteForm = false;
  newSociete = { nom: '', description: '' };
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadSocietes();
  }

  loadSocietes() {
    this.http.get<any[]>('http://localhost:3000/api/societes')
      .subscribe(data => {
        console.log('Received Sociétés:', data); // ✅ Debugging log
        this.dataSource = new MatTableDataSource(data);
      }, error => {
        console.error('API Error:', error);
      });
  }

  openAddSocieteForm() {
    this.showAddSocieteForm = true;
    this.newSociete = { nom: '', description: '' };
  }

  closeAddSocieteForm(event: Event) {
    this.showAddSocieteForm = false;
  }

  openModal(editMode: boolean, societe?: any) {
    this.isEditMode = editMode;
    this.showModal = true;

    if (editMode && societe) {
      this.selectedSociete = { ...societe }; // ✅ Copy the object to avoid direct mutations
    } else {
      this.selectedSociete = { nom: '', description: '' };
    }
  }
  toggleSocieteForm() {
    this.isEditMode = false;
    this.selectedSociete = { nom: '', description: '' };
    this.showSocieteForm = true;
  }

  closeSocieteForm(event: Event) {
    this.showSocieteForm = false;
  }
  onAddSociete() {
    if (!this.newSociete.nom.trim()) {
      alert('Le nom de la société est requis.');
      return;
    }

    this.http.post('http://localhost:3000/api/societes', this.newSociete)
      .subscribe(() => {
        this.loadSocietes();
        this.showAddSocieteForm = false;
      });
  }

  onEditSociete() {
    if (!this.selectedSociete.nom.trim()) {
      alert('Le nom de la société est requis.');
      return;
    }

    this.http.put(`http://localhost:3000/api/societes/${this.selectedSociete.id}`, {
      nom: this.selectedSociete.nom,
      description: this.selectedSociete.description
    }).subscribe(
      () => {
        this.loadSocietes();
        this.showEditSocieteForm = false;
      },
      (error) => {
        console.error('Edit Error:', error);
      }
    );
  }


  openEditSocieteForm(societe: any) {
    this.selectedSociete = { ...societe };
    this.showEditSocieteForm = true;
  }

  closeEditSocieteForm(event: Event) {
    this.showEditSocieteForm = false;
  }
  onSubmit() {
    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/api/societes/${this.selectedSociete.id}`, this.selectedSociete)
        .subscribe(() => {
          this.loadSocietes();
          this.showSocieteForm = false;
        });
    } else {
      this.http.post('http://localhost:3000/api/societes', this.selectedSociete)
        .subscribe(() => {
          this.loadSocietes();
          this.showSocieteForm = false;
        });
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveSociete() {
    if (this.selectedSociete.nom.trim() === '') {
      alert('Le nom de la société est requis');
      return;
    }

    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/api/societes/${this.selectedSociete.id}`, this.selectedSociete)
        .subscribe(() => {
          this.loadSocietes();
          this.closeModal();
        });
    } else {
      this.http.post('http://localhost:3000/api/societes', this.selectedSociete)
        .subscribe(() => {
          this.loadSocietes();
          this.closeModal();
        });
    }
  }
  deleteSociete(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
      this.http.delete(`http://localhost:3000/api/societes/${id}`)
        .subscribe(() => this.loadSocietes());
    }
  }
}