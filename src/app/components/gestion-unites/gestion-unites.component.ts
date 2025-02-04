import { Component } from '@angular/core';
import { UniteService, Unite } from '../../services/unite.service';
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

@Component({
  selector: 'app-gestion-unites',
  imports: [CommonModule,
    MatTableModule,
    MatIconModule,
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
  unites: Unite[] = [];
  constructor(private uniteService: UniteService) { }

  ngOnInit() {
    this.loadUnites();
  }

  loadUnites() {
    this.uniteService.getUnites().subscribe(data => {
      this.unites = data;
    });
  }

  deleteUnite(id: number) {
    this.uniteService.deleteUnite(id).subscribe(() => {
      this.unites = this.unites.filter(unite => unite.id !== id);
    });
  }
}