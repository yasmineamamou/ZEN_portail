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
import { CubeService } from '../../services/cube.service';
@Component({
  selector: 'app-gestion-cubes',
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
  templateUrl: './gestion-cubes.component.html',
  styleUrl: './gestion-cubes.component.css'
})
export class GestionCubesComponent {
  displayedColumns: string[] = ['name', 'description'];
  dataSource = new MatTableDataSource<any>([]);
  showAddCubeForm = false;
  showEditCubeForm = false;
  isEditMode = false;

  newCube = { nom: '', description: '' };
  selectedCube: any = { id: null, nom: '', description: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cubeService: CubeService, private http: HttpClient) { }

  ngOnInit() {
    this.loadCubes();
  }

  loadCubes() {
    this.cubeService.getCubes().subscribe(data => {
      console.log('Loaded Postes:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  openAddCubeForm() {
    this.showAddCubeForm = true;
    this.newCube = { nom: '', description: '' };
  }

  closeAddCubeForm() {
    this.showAddCubeForm = false;
  }

  openEditCubeForm(cube: any) {
    if (!cube || !cube.id) {
      console.error('Error: cube ID is missing!', cube);
      return;
    }

    this.selectedCube = { ...cube };
    console.log('Editing Cube:', this.selectedCube); // ✅ Log to confirm the ID exists
    this.showEditCubeForm = true;
  }


  closeEditCubeForm() {
    this.showEditCubeForm = false;
  }

  onAddCube() {
    if (!this.newCube.nom.trim()) {
      alert('Le nom de cube est requis.');
      return;
    }

    this.cubeService.addCube(this.newCube).subscribe(() => {
      this.loadCubes();
      this.showAddCubeForm = false;
    });
  }

  onEditCube() {
    if (!this.selectedCube.nom.trim()) {
      alert('Le nom de cube est requis.');
      return;
    }

    console.log('Updating Cube:', this.selectedCube); // ✅ Debugging Log

    this.cubeService.updateCube(this.selectedCube.id, this.selectedCube)
      .subscribe(
        response => {
          console.log('Cube Updated Successfully:', response); // ✅ Success Log
          this.loadCubes();
          this.showEditCubeForm = false;
        },
        error => {
          console.error('Edit Error:', error); // ✅ Log error response
        }
      );
  }
  deleteCube(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette cube ?')) {
      this.cubeService.deleteCube(id).subscribe(() => this.loadCubes());
    }
  }
}
