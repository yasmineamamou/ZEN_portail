import { Component, ViewChild } from '@angular/core';
import { UniteService, Unite } from '../../services/unite.service';
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
  selector: 'app-gestion-unites',
  imports: [CommonModule,
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
    MatRadioModule],
  templateUrl: './gestion-unites.component.html',
  styleUrl: './gestion-unites.component.css'
})
export class GestionUnitesComponent {
  displayedColumns: string[] = ['name', 'description'];
  dataSource = new MatTableDataSource<any>([]);
  showAddUniteForm = false;
  showEditUniteForm = false;
  isEditMode = false;

  newUnite = { nom: '', description: '' };
  selectedUnite: any = { id: null, nom: '', description: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  unites: Unite[] = [];
  constructor(private uniteService: UniteService, private http: HttpClient) { }

  ngOnInit() {
    this.loadUnites();
  }

  loadUnites() {
    this.uniteService.getUnites().subscribe(data => {
      console.log('Loaded Unités:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  openAddUniteForm() {
    this.showAddUniteForm = true;
    this.newUnite = { nom: '', description: '' };
  }

  closeAddUniteForm() {
    this.showAddUniteForm = false;
  }

  openEditUniteForm(unite: any) {
    if (!unite || !unite.id) {
      console.error('Error: Unité ID is missing!', unite);
      return;
    }

    this.selectedUnite = { ...unite };
    console.log('Editing Unité:', this.selectedUnite); // ✅ Log to confirm the ID exists
    this.showEditUniteForm = true;
  }


  closeEditUniteForm() {
    this.showEditUniteForm = false;
  }

  onAddUnite() {
    if (!this.newUnite.nom.trim()) {
      alert('Le nom de la unité est requis.');
      return;
    }

    this.uniteService.addUnite(this.newUnite).subscribe(() => {
      this.loadUnites();
      this.showAddUniteForm = false;
    });
  }

  onEditUnite() {
    if (!this.selectedUnite.nom.trim()) {
      alert('Le nom de la unité est requis.');
      return;
    }

    console.log('Updating Unité:', this.selectedUnite); // ✅ Debugging Log

    this.uniteService.updateUnite(this.selectedUnite.id, this.selectedUnite)
      .subscribe(
        response => {
          console.log('Unité Updated Successfully:', response); // ✅ Success Log
          this.loadUnites();
          this.showEditUniteForm = false;
        },
        error => {
          console.error('Edit Error:', error); // ✅ Log error response
        }
      );
  }
  deleteUnite(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette unité ?')) {
      this.uniteService.deleteUnite(id).subscribe(() => this.loadUnites());
    }
  }
}