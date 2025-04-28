import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormationService } from '../../services/formation.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-gestion-formation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,],
  templateUrl: './gestion-formation.component.html',
  styleUrl: './gestion-formation.component.css'
})
export class GestionFormationComponent {
  searchTerm: string = '';
  selectedModule: string = '';
  moduleGroups: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  showAddFormationForm = false;
  showEditFormationForm = false;
  isEditMode = false;
  selectedFormation: any = { id: null, nom: '', description: '', objectif: '', telechargable: false, module_ids: null, departements: null };
  shortLink: string = "";
  loading: boolean = false; // Flag variable
  file: File | null = null; // ✅ Allow both File and null
  modules: any[] = [];
  departements: any[] = [];
  selectedModules: number[] = [];
  dropdownOpen = false;
  showModuleDropdown = false;
  formationForm: FormGroup;
  newFormation: {
    titre: string;
    description: string;
    objectif: string;
    telechargable: boolean;
    module_ids: number[];
    departements: number[];
    [key: string]: any; // facultatif, pour flexibilité
  } = {
      titre: '',
      description: '',
      objectif: '',
      telechargable: false,
      module_ids: [],
      departements: [],
    };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  constructor(private formationService: FormationService, private http: HttpClient, private fb: FormBuilder,) {
    {
      this.formationForm = this.fb.group({
        titre: [''],
        description: [''],
        objectif: [''],
        telechargable: [false],
        modules: [[]],
        departements: [[]]
      });
    }
  }

  ngOnInit(): void {
    this.loadFormationsByModule();
    this.loadModule();
    this.loadDepartements(); // ✅
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.dropdownRef?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.dropdownOpen = false;
    }
  }
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.showModuleDropdown = false;
    }
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  toggleDepartementDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }


  onDepartementCheckboxChange(event: any) {
    const id = +event.target.value;

    if (event.target.checked) {
      this.newFormation.departements.push(id);
    } else {
      this.newFormation.departements = this.newFormation.departements.filter(d => d !== id);
    }
  }

  getSelectedDepartementsLabel(): string {
    return this.departements
      .filter(dep => this.newFormation.departements.includes(dep.id))
      .map(dep => dep.nom)
      .join(', ');
  }


  onModuleNgModelChange(event: any) {
    console.log("📦 Updated module IDs:", this.selectedModules);
    this.formationForm.patchValue({ modules: this.selectedModules }); // ✅ sync with form
  }



  onSearchChange() {
    console.log('Search Term:', this.searchTerm);
    // Add your search logic here
  }

  onModuleFilterChange() {
    console.log('Selected Module:', this.selectedModule);
    // Add your filter logic here
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

  openAddFormationForm() {
    this.showAddFormationForm = true;
  }

  closeAddFormationForm() {
    this.showAddFormationForm = false;
  }

  openEditFormationForm(formation: any) {
    if (!formation || !formation.id) {
      console.error('Error: formation ID is missing!', formation);
      return;
    }

    this.selectedFormation = { ...formation };
    console.log('Editing formation:', this.selectedFormation); // ✅ Log to confirm the ID exists
    this.showEditFormationForm = true;
  }

  closeEditFormationForm() {
    this.showEditFormationForm = false;
  }
  deleteFormation(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette Formation ?')) {
      this.formationService.deleteFormation(id).subscribe(() => this.loadFormationsByModule());
    }
  }
  onAddFormation() {
    const formationData = {
      ...this.formationForm.value,
      modules: this.newFormation.module_ids,
      departements: this.newFormation.departements
    };
    console.log("📤 Sending formationData:", formationData);

    this.formationService.addFormation(formationData).subscribe(res => {
      const formationId = res?.data?.id;

      if (formationId) {
        // Upload file
        if (this.file) {
          this.formationService.uploadOrganigrammeFormation(this.file, formationId).subscribe();
        }
        alert("Formation created successfully!");
        this.loadFormationsByModule();
        this.showAddFormationForm = false;
      }
    });
  }

  loadDepartements() {
    this.formationService.getDepartements().subscribe(data => {
      this.departements = data;
    });
  }

  toggleModuleDropdown() {
    this.showModuleDropdown = !this.showModuleDropdown;
  }

  onDropdownClick(event: MouseEvent) {
    // Prevent closing when clicking inside
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'LABEL' ||
      target.closest('.custom-dropdown-content')
    ) {
      return; // Do nothing if clicking inside
    }

    this.toggleModuleDropdown(); // Only toggle when clicking the outside wrapper
  }

  onModuleCheckChange(id: number) {
    const currentSelection = this.formationForm.value.modules || [];
    if (currentSelection.includes(id)) {
      this.formationForm.patchValue({
        modules: currentSelection.filter((i: number) => i !== id),
      });
    } else {
      this.formationForm.patchValue({
        modules: [...currentSelection, id],
      });
    }
  }

  isModuleSelected(id: number): boolean {
    return this.formationForm.value.modules?.includes(id);
  }

  selectedModulesLabel(): string {
    const selected = this.formationForm.value.modules || [];
    if (selected.length === 0) return '';
    return this.modules
      .filter((m) => selected.includes(m.id))
      .map((m) => m.nom)
      .join(', ');
  }

  onModulesChange(event: Event) {
    const selected = Array.from((event.target as HTMLSelectElement).selectedOptions)
      .map(option => Number(option.value));
    console.log('Selected modules:', selected);
  }

  loadModule() {
    this.formationService.getModule().subscribe(data => {
      this.modules = data.map(module => ({
        ...module,
        id: Number(module.id) // ✅ Convert id to number
      }));
    });
  }

  loadFormationsByModule() {
    forkJoin({
      formations: this.formationService.getFormation(),
      modules: this.formationService.getModule(),
      links: this.formationService.getFormationModules()
    }).subscribe(({ formations, modules, links }) => {
      const grouped: any[] = [];

      modules.forEach((mod: any) => {
        const formationIds = links
          .filter((link: any) => link.module_id === mod.id)
          .map((link: any) => link.formation_id);

        const relatedFormations = formations.filter((f: any) =>
          formationIds.includes(f.id)
        );

        grouped.push({
          moduleName: mod.nom,
          formations: relatedFormations
        });
      });

      this.moduleGroups = grouped;
      console.log("✅ Grouped by module (frontend logic):", this.moduleGroups);
    });
  }

}
