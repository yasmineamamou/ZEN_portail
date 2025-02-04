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
import { SocieteService } from '../../services/societe.service';

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
  dataSource = new MatTableDataSource<any>([]);
  showAddSocieteForm = false;
  showEditSocieteForm = false;
  isEditMode = false;

  newSociete = { nom: '', description: '' };
  selectedSociete: any = { id: null, nom: '', description: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private societeService: SocieteService, private http: HttpClient) { } // ✅ Inject Service

  ngOnInit(): void {
    this.loadSocietes();
  }

  loadSocietes() {
    this.societeService.getSocietes().subscribe(data => {
      console.log('Loaded Sociétés:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  openAddSocieteForm() {
    this.showAddSocieteForm = true;
    this.newSociete = { nom: '', description: '' };
  }

  closeAddSocieteForm() {
    this.showAddSocieteForm = false;
  }

  openEditSocieteForm(societe: any) {
    if (!societe || !societe.id) {
      console.error('Error: Société ID is missing!', societe);
      return;
    }

    this.selectedSociete = { ...societe };
    console.log('Editing Société:', this.selectedSociete); // ✅ Log to confirm the ID exists
    this.showEditSocieteForm = true;
  }


  closeEditSocieteForm() {
    this.showEditSocieteForm = false;
  }

  onAddSociete() {
    if (!this.newSociete.nom.trim()) {
      alert('Le nom de la société est requis.');
      return;
    }

    this.societeService.addSociete(this.newSociete).subscribe(() => {
      this.loadSocietes();
      this.showAddSocieteForm = false;
    });
  }

  onEditSociete() {
    if (!this.selectedSociete.nom.trim()) {
      alert('Le nom de la société est requis.');
      return;
    }

    console.log('Updating Société:', this.selectedSociete); // ✅ Debugging Log

    this.societeService.updateSociete(this.selectedSociete.id, this.selectedSociete)
      .subscribe(
        response => {
          console.log('Société Updated Successfully:', response); // ✅ Success Log
          this.loadSocietes();
          this.showEditSocieteForm = false;
        },
        error => {
          console.error('Edit Error:', error); // ✅ Log error response
        }
      );
  }

  deleteSociete(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
      this.societeService.deleteSociete(id).subscribe(() => this.loadSocietes());
    }
  }
}