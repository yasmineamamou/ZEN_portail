import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormationService } from '../../services/formation.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { ElementRef, HostListener } from '@angular/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-gestion-formation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  // newFormation = { titre: '', description: '', objectif: '', telechargable: false, module_ids: null };
  selectedFormation: any = { id: null, nom: '', description: '', objectif: '', telechargable: false, module_ids: null, departements: null };
  shortLink: string = "";
  loading: boolean = false; // Flag variable
  file: File | null = null; // ✅ Allow both File and null
  modules: any[] = [];
  departements: any[] = [];
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
  selectedModules: number[] = [];

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
  showModuleDropdown = false;
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.showModuleDropdown = false;
    }
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
    const formationData = this.formationForm.value;

    this.formationService.addFormation(formationData).subscribe(res => {
      const formationId = res?.data?.id;

      if (formationId) {
        // Upload file
        if (this.file) {
          this.formationService.uploadOrganigrammeFormation(this.file, formationId).subscribe();
        }

        // Add formation_module relations
        const moduleIds = formationData.modules;
        moduleIds.forEach((moduleId: number) => {
          this.formationService.linkModuleToFormation(formationId, moduleId).subscribe();
        });
        formationData.departements.forEach((depId: number) => {
          this.formationService.addFormationDepartement(formationId, depId).subscribe();
        });
        alert("Formation created successfully!");
        this.loadFormationsByModule();
        this.showAddFormationForm = false;
      }
    });

  }

}
