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
  displayedColumns: string[] = ['name', 'description', 'rne', 'pays', 'adresse', 'Type', 'organigramme', 'actions'];
  imagePreview: string | null = null;
  dataSource = new MatTableDataSource<any>([]);
  showAddSocieteForm = false;
  showEditSocieteForm = false;
  isEditMode = false;
  newSociete = { nom: '', rne: '', pays: '', adresse: '', Type: '', description: '' };
  selectedSociete: any = { id: null, nom: '', rne: '', pays: '', adresse: '', Type: '', description: '' };
  selectedFile!: File;
  uploadedFilePath!: string;

  shortLink: string = "";
  loading: boolean = false; // Flag variable
  file: File | null = null; // ✅ Allow both File and null

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private societeService: SocieteService, private http: HttpClient) { } // ✅ Inject Service

  ngOnInit(): void {
    this.loadSocietes();
  }
  onChange(event: Event) {
    const inputElement = event.target as HTMLInputElement; // ✅ Type assertion
    if (inputElement.files && inputElement.files.length > 0) {
      this.file = inputElement.files[0]; // ✅ Now TypeScript recognizes `files`
    }
  }

  loadSocietes() {
    this.societeService.getSocietes().subscribe(data => {
      console.log('Loaded Sociétés:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.file = file; // Store the selected file
      console.log("Selected file:", file.name);
    }
  }


  // OnClick of button Upload
  onUpload() {
    if (!this.file) { // ✅ Ensure file is selected before upload
      alert("Please select a file before uploading.");
      return;
    }

    this.loading = true; // Start loading
    console.log("Uploading file:", this.file);

    // this.societeService.upload(this.file).subscribe(
    //   (event: any) => {
    //     if (typeof event === 'object') {
    //       this.shortLink = event.link;
    //       this.loading = false; // Stop loading
    //     }
    //   },
    //   (error) => {
    //     console.error("Upload failed:", error);
    //     this.loading = false;
    //   }
    // );
  }
  openAddSocieteForm() {
    this.showAddSocieteForm = true;
    this.newSociete = { nom: '', description: '', rne: '', pays: '', adresse: '', Type: '' };
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
    this.societeService.addSociete(this.newSociete).subscribe(res => {
      console.log("Societe added response:", res); // Debugging log

      if (res && res.data && res.data.id) {
        if (this.file) {
          this.societeService.upload(this.file, res.data.id).subscribe(
            (event: any) => {
              if (typeof event === 'object') {
                this.shortLink = event.link;
                this.loading = false; // Stop loading
              }
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

      this.loadSocietes();
      this.showAddSocieteForm = false;
    });
  }


  onEditSociete() {
    if (!this.selectedSociete.nom.trim()) {
      alert('Le nom de la société est requis.');
      return;
    }

    this.societeService.updateSociete(this.selectedSociete.id, this.selectedSociete).subscribe(res => {
      console.log("Société updated successfully:", res);

      if (this.file) {  // If user uploaded a new file
        this.societeService.updateOrganigramme(this.file, this.selectedSociete.id).subscribe(
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

      this.loadSocietes();
      this.showEditSocieteForm = false;
    });
  }

  deleteSociete(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
      this.societeService.deleteSociete(id).subscribe(() => this.loadSocietes());
    }
  }
}