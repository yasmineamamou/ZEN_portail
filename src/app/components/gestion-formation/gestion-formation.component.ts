import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../services/formation.service';

@Component({
  selector: 'app-gestion-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-formation.component.html',
  styleUrl: './gestion-formation.component.css'
})
export class GestionFormationComponent {
  searchTerm: string = '';
  selectedModule: string = '';
  moduleGroups: any[] = [];


  constructor(private formationService: FormationService) { }

  ngOnInit(): void {
    this.loadFormationsByModule();
  }

  loadFormationsByModule(): void {
    this.formationService.getFormationsByModule().subscribe((data: any) => {
      this.moduleGroups = data;
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
}
