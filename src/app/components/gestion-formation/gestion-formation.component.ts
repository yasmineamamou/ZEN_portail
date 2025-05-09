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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { renderAsync } from 'docx-preview';
declare const pdfjsLib: any;
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
  previewImages: string[] = [];
  convertedImages: string[] = [];
  showPdfViewer = false;
  previewUrl: string | null = null;

  isEditMode = false;
  editingFormationId: number | null = null;
  selectedModule: string = '';
  moduleGroups: any[] = [];
  openMenus: { [key: string]: boolean } = {};
  showAddFormationForm = false;
  showEditFormationForm = false;
  selectedFormation: any = { id: null, nom: '', description: '', objectif: '', telechargable: false, module_ids: null, departements: null };
  file: File | null = null; // ✅ Allow both File and null
  safePreviewUrl: SafeResourceUrl | null = null;

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
  @ViewChild('docxContainer') docxContainer!: ElementRef;

  constructor(private formationService: FormationService, private http: HttpClient, private fb: FormBuilder, private sanitizer: DomSanitizer) {
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

  hasAnyVisibleFormation(): boolean {
    return this.moduleGroups.some(group => this.getPaginatedFormations(group).length > 0);
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

  async renderPdfAsImages(url: string): Promise<void> {
    this.previewImages = [];

    const pdf = await pdfjsLib.getDocument(url).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      const img = canvas.toDataURL();
      this.previewImages.push(img);
    }
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
  isPdf(url: string): boolean {
    return /\.pdf$/i.test(url);
  }

  isOffice(url: string): boolean {
    return /\.(doc|docx|xls|xlsx)$/i.test(url);
  }



  isImage(url: string): boolean {
    return /\.(jpeg|jpg|png|gif)$/i.test(url);
  }

  isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  isPdfOrOffice(url: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx)$/i.test(url);
  }

  buildGoogleViewer(url: string): string {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
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

  closePreview(): void {
    this.previewUrl = null;
    this.convertedImages = [];
  }




  viewPdfAsImages(formation: any): void {
    console.log('🧾 Start converting PDF for formation ID:', formation.id);
    this.convertedImages = [];

    this.formationService.getPdfImagesById(formation.id).subscribe({
      next: (res) => {
        console.log('🖼 PDF conversion success:', res);
        this.convertedImages = res.images.map(url => `http://localhost:3000${url}`);
      },
      error: (err) => {
        console.error('❌ PDF conversion failed:', err);
        alert('Impossible de charger le document PDF.');
      }
    });
  }
  openFormationFile(formation: any): void {
    const fileUrl = `http://localhost:3000/secure-file/${formation.id}`;
    const fileType = (formation.file_type || '').toLowerCase();

    // Always open file directly in new tab — let browser decide how to render
    window.open(fileUrl, '_blank');
  }

  previewFormationFile(formation: any): void {
    const fileUrl = `http://localhost:3000/secure-file/${formation.id}`;
    const fileType = (formation.file_type || '').toLowerCase();

    this.previewUrl = fileUrl;
    this.convertedImages = [];

    if (fileType === 'pdf') {
      this.viewPdfAsImages(formation); // Poppler handles both doc and pdf (after conversion)
      return;
    }
    if (formation.file_type === 'docx') {
      this.previewDocxFromUrl(`http://localhost:3000/${formation.piece_jointe.replace(/^\//, '')}`);
    }

    // ✅ Force all images to open in new tab
    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png' || fileType === 'gif' || fileType === 'webp') {
      console.log("🖼 Redirecting image to openFormationFile()");
      this.openFormationFile(formation);
      return;
    }

    if (this.isVideo(fileUrl)) {
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
      return;
    }

  }

  async previewDocxFromUrl(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();

      // ✅ Open a new window
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        alert('Le popup a été bloqué. Veuillez autoriser les fenêtres contextuelles.');
        return;
      }

      // ✅ Inject basic HTML structure
      newWindow.document.write(`
        <html>
          <head>
            <title>Prévisualisation Word</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .docx-container { max-width: 800px; margin: auto; }
            </style>
          </head>
          <body>
            <div class="docx-container" id="docxContainer">Chargement...</div>
          </body>
        </html>
      `);
      newWindow.document.close();

      // ✅ Wait for the DOM to be available
      await new Promise(resolve => setTimeout(resolve, 500));

      const container = newWindow.document.getElementById('docxContainer');
      if (!container) throw new Error('Container not found in new window');

      container.innerHTML = ''; // clear placeholder

      // ✅ Render the .docx content
      await renderAsync(blob, container, undefined);

    } catch (err: any) {
      console.error("❌ Error rendering DOCX:", err);
      alert(`Erreur lors du rendu du fichier DOCX: ${err.message || err}`);
    }
  }

}
