import { Component, ViewChild } from '@angular/core';
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
import { PosteService } from '../../services/poste.service';

@Component({
  selector: 'app-gestion-postes',
  imports: [
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
    MatRadioModule,
    CommonModule
  ],
  templateUrl: './gestion-postes.component.html',
  styleUrl: './gestion-postes.component.css'
})
export class GestionPostesComponent {
  displayedColumns: string[] = ['name', 'description'];
  dataSource = new MatTableDataSource<any>([]);
  showAddPosteForm = false;
  showEditPosteForm = false;
  isEditMode = false;

  newPoste = { nom: '', description: '' };
  selectedPoste: any = { id: null, nom: '', description: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private posteService: PosteService, private http: HttpClient) { }

  ngOnInit() {
    this.loadPostes();
  }

  loadPostes() {
    this.posteService.getPostes().subscribe(data => {
      console.log('Loaded Postes:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  openAddPosteForm() {
    this.showAddPosteForm = true;
    this.newPoste = { nom: '', description: '' };
  }

  closeAddPosteForm() {
    this.showAddPosteForm = false;
  }

  openEditPosteForm(poste: any) {
    if (!poste || !poste.id) {
      console.error('Error: poste ID is missing!', poste);
      return;
    }

    this.selectedPoste = { ...poste };
    console.log('Editing Poste:', this.selectedPoste); // ✅ Log to confirm the ID exists
    this.showEditPosteForm = true;
  }


  closeEditPosteForm() {
    this.showEditPosteForm = false;
  }

  onAddPoste() {
    if (!this.newPoste.nom.trim()) {
      alert('Le nom de la poste est requis.');
      return;
    }

    this.posteService.addPoste(this.newPoste).subscribe(() => {
      this.loadPostes();
      this.showAddPosteForm = false;
    });
  }

  onEditPoste() {
    if (!this.selectedPoste.nom.trim()) {
      alert('Le nom de la poste est requis.');
      return;
    }

    console.log('Updating Poste:', this.selectedPoste); // ✅ Debugging Log

    this.posteService.updatePoste(this.selectedPoste.id, this.selectedPoste)
      .subscribe(
        response => {
          console.log('Poste Updated Successfully:', response); // ✅ Success Log
          this.loadPostes();
          this.showEditPosteForm = false;
        },
        error => {
          console.error('Edit Error:', error); // ✅ Log error response
        }
      );
  }
  deletePoste(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette poste ?')) {
      this.posteService.deletePoste(id).subscribe(() => this.loadPostes());
    }
  }
}