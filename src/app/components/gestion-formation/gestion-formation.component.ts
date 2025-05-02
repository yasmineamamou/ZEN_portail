import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormationService } from '../../services/formation.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  formations: any[] = [];
  modules: any[] = [];
  departements: any[] = [];
  formationModules: any[] = [];
  formationDepartements: any[] = [];

  isEditMode = false;
  editingFormationId: number | null = null;
  selectedModule: string = '';
  moduleGroups: any[] = [];
  openMenus: { [key: string]: boolean } = {};
  showAddFormationForm = false;
  showEditFormationForm = false;
  selectedFormation: any = { id: null, nom: '', description: '', objectif: '', telechargable: false, module_ids: null, departements: null };
  file: File | null = null; // ✅ Allow both File and null

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
  editFormationForm: FormGroup;
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
      this.editFormationForm = this.fb.group({
        titre: ['', Validators.required],
        description: ['', Validators.required],
        objectif: ['', Validators.required],
        telechargable: [false, Validators.required]
      });

    }

  }

  ngOnInit(): void {
    this.loadFormationsByModule();
    this.loadModule();
    this.loadDepartements(); // ✅
    this.loadAllFormationsData();
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


  onAddFormation() {
    const formationData = {
      ...this.formationForm.value,
      modules: this.newFormation.module_ids,
      departements: this.newFormation.departements
    };

    console.log("📤 Sending formation data:", formationData);

    this.formationService.addFormation(formationData).subscribe(res => {
      const formationId = res?.data?.id;

      if (formationId) {
        if (this.file) {
          this.formationService.uploadOrganigrammeFormation(this.file, formationId).subscribe(() => {
            alert("✅ File uploaded!");
          });
        }

        alert("✅ Formation created successfully!");
        this.loadFormationsByModule();
        this.showAddFormationForm = false;
      }
    }, err => {
      console.error("❌ Error creating formation:", err);
    });
  }

  loadFormationsWithRelations() {
    forkJoin({
      formations: this.formationService.getFormation(),
      modulesMap: this.formationService.getFormationModules(),
      departementsMap: this.formationService.getDepartements()
    }).subscribe(({ formations, modulesMap, departementsMap }) => {
      // Attach related modules & departements to each formation
      this.formations = formations.map((f: any) => ({
        ...f,
        modules: modulesMap.filter((m: any) => m.formation_id === f.id),
        departements: departementsMap.filter((d: any) => d.formation_id === f.id)
      }));
    });
  }
  onEdit(formation: any) {
    console.log("🔍 Formation ID to match:", formation.id);
    console.log("📦 All formationDepartements:", this.formationDepartements);

    // 🔎 Type check debug
    this.formationDepartements.forEach(fd => {
      console.log(`🔎 Comparing: ${typeof fd.formation_id} (${fd.formation_id}) vs ${typeof formation.id} (${formation.id})`);
    });

    const departements = this.formationDepartements
      .filter(d => +d.formation_id === +formation.id)
      .map(d => d.departement_id);

    const module_ids = this.formationModules
      .filter(m => +m.formation_id === +formation.id)
      .map(m => m.module_id);

    console.log("✅ Matched departement_ids:", departements);
    console.log("✅ Matched module_ids:", module_ids);

    this.selectedFormation = {
      ...formation,
      module_ids: module_ids,
      departements: departements,
      organigramme_path: formation.organigramme_path
    };

    this.editFormationForm.patchValue({
      titre: formation.titre,
      description: formation.description,
      objectif: formation.objectif,
      telechargable: formation.telechargable
    });

    this.showEditFormationForm = true;
  }


  onEditFormation() {
    const updatedData = {
      ...this.editFormationForm.value,
      modules: this.selectedFormation.module_ids,
      departements: this.selectedFormation.departements
    };

    console.log("📤 Sending update:", updatedData); // ✅ add this

    this.formationService.updateFormation(this.selectedFormation.id, updatedData).subscribe(() => {
      if (this.file) {
        this.formationService.uploadOrganigrammeFormation(this.file, this.selectedFormation.id).subscribe();
      }

      alert("Formation mise à jour !");
      this.loadAllFormationsData();
      this.showEditFormationForm = false;
    });
  }
  closeEditFormationForm() {
    this.showEditFormationForm = false;
    this.editFormationForm.reset();
    this.selectedFormation = {
      module_ids: [],
      departements: [],
      organigramme_path: null
    };
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
          formations: relatedFormations,
          currentPage: 1,         // ✅ add pagination state
          itemsPerPage: 4         // ✅ default items per page
        });
      });

      this.moduleGroups = grouped;
      console.log("✅ Grouped by module (frontend logic):", this.moduleGroups);
    });
  }
  toggleMenu(groupIndex: number, formationId: number): void {
    const key = `${groupIndex}_${formationId}`;
    if (this.openMenus[key]) {
      this.openMenus[key] = false;
    } else {
      this.openMenus = {}; // Close all others
      this.openMenus[key] = true;
    }
  }

  onDelete(id: number) {
    if (confirm("Voulez-vous vraiment supprimer cette formation ?")) {
      this.formationService.deleteFormation(id).subscribe(() => {
        alert("Formation supprimée !");
        this.loadFormationsByModule();
      }, error => {
        console.error("❌ Erreur suppression:", error);
      });
    }
  }

  loadAllFormationsData() {
    forkJoin({
      formations: this.formationService.getFormation(),
      formationModules: this.formationService.getFormationModules(),
      formationDepartements: this.formationService.getFormationDepartements(),
      modules: this.formationService.getModule(),
      departements: this.formationService.getDepartements()
    }).subscribe(({ formations, formationModules, formationDepartements, modules, departements }) => {
      this.formations = formations;
      this.modules = modules;
      this.departements = departements;
      this.formationModules = formationModules;
      this.formationDepartements = formationDepartements; // ✅ this line is critical
      this.formations = formations.map(f => ({
        ...f,
        modules: formationModules.filter(m => m.formation_id === f.id),
        departements: formationDepartements.filter(d => d.formation_id === f.id)
      }));
      console.log("✅ formationDepartements loaded:", this.formationDepartements);
    });
  }

  onSend(formation: any) {
    console.log('Send:', formation);
    // Trigger your send logic here
  }
  getPaginatedFormations(group: any): any[] {
    const term = this.searchTerm?.trim().toLowerCase() || '';

    let filtered = group.formations;
    if (term) {
      filtered = filtered.filter((f: { titre: string; file_type: string; }) =>
        f.titre?.toLowerCase().includes(term) ||
        f.file_type?.toLowerCase().includes(term)
      );
    }

    const start = (group.currentPage - 1) * group.itemsPerPage;
    const end = start + group.itemsPerPage;

    return filtered.slice(start, end);
  }


  getTotalPages(group: any): number[] {
    const total = Math.ceil(group.formations.length / group.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  changePage(group: any, page: number): void {
    group.currentPage = page;
  }
  prevPage(group: any): void {
    if (group.currentPage > 1) {
      group.currentPage--;
    }
  }

  nextPage(group: any): void {
    if (group.currentPage < this.getTotalPages(group).length) {
      group.currentPage++;
    }
  }

}
