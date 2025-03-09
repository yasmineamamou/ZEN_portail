import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
import { DepartementService } from '../../services/departement.service';
@Component({
  selector: 'app-gestion-dep',
  imports: [
    FormsModule,
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
    MatSelectModule,
    MatSlideToggleModule,
    MatRadioModule,
  ],
  templateUrl: './gestion-dep.component.html',
  styleUrl: './gestion-dep.component.css'
})
export class GestionDepComponent implements OnInit {
  displayedColumns: string[] = ['name', 'societe', 'organigramme'];
  dataSource = new MatTableDataSource<any>([]);
  societes: any[] = [];
  showAddDepartementForm = false;
  showEditDepartementForm = false;
  isEditMode = false;
  newDepartement = { nom: '', societe_id: null }; // ✅ Ensure correct structure

  selectedDepartement: any = { id: null, nom: '', societe_id: null };

  shortLink: string = "";
  loading: boolean = false; // Flag variable
  file: File | null = null; // ✅ Allow both File and null


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private departementService: DepartementService, private http: HttpClient) { } // ✅ Inject Service

  ngOnInit(): void {
    this.loadDepartements();
    this.loadSocietes();
  }

  loadDepartements() {
    this.departementService.getDepartements().subscribe(data => {
      console.log('Loaded Departements:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadSocietes() {
    this.departementService.getSocietes().subscribe(data => {
      this.societes = data.map(societe => ({
        ...societe,
        id: Number(societe.id) // ✅ Convert id to number
      }));
    });
  }

  openAddDepartementForm() {
    this.showAddDepartementForm = true;
    this.newDepartement = { nom: '', societe_id: null };
  }

  closeAddDepartementForm() {
    this.showAddDepartementForm = false;
  }

  openEditDepartementForm(departement: any) {
    this.selectedDepartement = { ...departement };

    console.log('Editing Departement:', this.selectedDepartement); // ✅ Debugging log

    // Ensure societe_id is assigned correctly
    const matchingSociete = this.societes.find(s => s.nom === departement.societe);
    this.selectedDepartement.societe_id = matchingSociete ? matchingSociete.id : null;

    console.log('Société ID:', this.selectedDepartement.societe_id); // ✅ Debugging log

    this.showEditDepartementForm = true;
  }

  closeEditDepartementForm() {
    this.showEditDepartementForm = false;
  }
  onAddDepartement() {
    this.departementService.addDepartement(this.newDepartement).subscribe(res => {
      console.log("Departement added response:", res);

      if (res && res.data && res.data.id) {
        console.log("Uploading file for Departement ID:", res.data.id); // ✅ Debugging log
        if (this.file) {
          this.departementService.uploadOrganigrammeDep(this.file, res.data.id).subscribe(
            (event: any) => {
              console.log("File uploaded successfully:", event.fileName); // ✅ Log success
              this.loading = false;
            },
            (error) => {
              console.error("Upload failed:", error);
              this.loading = false;
            }
          );
        }
      } else {
        console.error("Error: No ID returned from the server");
      }

      this.loadDepartements();
      this.showAddDepartementForm = false;
    });
  }

  onEditDepartement() {
    if (!this.selectedDepartement.nom.trim() || !this.selectedDepartement.societe_id) {
      alert('Le nom et la departement sont requis.');
      return;
    }

    this.departementService.updateDepartement(this.selectedDepartement.id, this.selectedDepartement).subscribe(res => {
      console.log("departement updated successfully:", res);

      if (this.file) {  // If user uploaded a new file
        this.departementService.updateOrganigramme(this.file, this.selectedDepartement.id).subscribe(
          (event: any) => {
            if (event.fileName) { // ✅ Display original file name
              console.log("File updated successfully:", event.fileName);
            }
            this.loading = false;
          },
          (error) => {
            console.error("File update failed:", error);
            this.loading = false;
          }
        );
      }
      this.loadDepartements();
      this.showEditDepartementForm = false;
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.file = file; // Store the selected file
      console.log("Selected file:", file.name);
    }
  }
  onChange(event: Event) {
    const inputElement = event.target as HTMLInputElement; // ✅ Type assertion
    if (inputElement.files && inputElement.files.length > 0) {
      this.file = inputElement.files[0]; // ✅ Now TypeScript recognizes `files`
    }
  }

  deleteDepartement(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      this.departementService.deleteDepartement(id).subscribe(() => this.loadDepartements());
    }
  }
}