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

  shortLink: string = "";
  loading: boolean = false; // Flag variable
  file: File | null = null; // ✅ Allow both File and null

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
  onChange(event: Event) {
    const inputElement = event.target as HTMLInputElement; // ✅ Type assertion
    if (inputElement.files && inputElement.files.length > 0) {
      this.file = inputElement.files[0]; // ✅ Now TypeScript recognizes `files`
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.file = file;
      console.log("Selected file:", file.name); // ✅ Debugging log
    }
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
    this.posteService.addPoste(this.newPoste).subscribe(
      (res: any) => {
        console.log("Full server response:", res);

        if (res?.data?.id) {
          const posteId = res.data.id;
          console.log("Successfully added poste with ID:", posteId);

          // Display or use the ID as needed
          alert(`Poste added successfully with ID: ${posteId}`);

          if (this.file) {
            this.posteService.uploadFicheFonction(this.file, posteId).subscribe(
              (event: any) => {
                console.log("File uploaded successfully:", event.fileName);
                this.loading = false;
              },
              (error) => {
                console.error("Upload failed:", error);
                this.loading = false;
              }
            );
          }
        } else {
          console.error("Error: No ID returned from the server", res);
        }

        this.loadPostes();
        this.showAddPosteForm = false;
      },
      (error) => {
        console.error("Poste creation failed:", error);
      }
    );
  }
  onEditPoste() {
    this.posteService.updatePoste(this.selectedPoste.id, this.selectedPoste).subscribe(res => {
      console.log("departement updated successfully:", res);

      if (this.file) {  // If user uploaded a new file
        this.posteService.updateOrganigramme(this.file, this.selectedPoste.id).subscribe(
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
      this.loadPostes();
      this.showEditPosteForm = false;
    });
  }

  deletePoste(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette poste ?')) {
      this.posteService.deletePoste(id).subscribe(() => this.loadPostes());
    }
  }
}