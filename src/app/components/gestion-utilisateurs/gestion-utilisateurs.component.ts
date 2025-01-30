import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSort,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css']
})
export class GestionUtilisateursComponent implements OnInit {
  displayedColumns: string[] = [
    'select', 'name', 'email', 'password', 'societe', 'unite',
    'poste', 'departement', 'menu_cube', 'date_creation', 'status', 'actions'
  ];
  dataSource = new MatTableDataSource<any>([]);
  selectedUsers: Set<number> = new Set();
  statusFilter: string = '';
  allSelected = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) { } // ✅ HttpClient will now work because it's provided globally

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/api/users').subscribe(data => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
  applyStatusFilter(filterValue: string) {
    this.statusFilter = filterValue;
    this.dataSource.filterPredicate = (data, filter) => {
      return filter === '' || data.status === filter;
    };
    this.dataSource.filter = filterValue;
  }

  toggleSelectAllUsers() {
    if (this.allSelected) {
      this.selectedUsers.clear(); // Deselect all
    } else {
      this.selectedUsers.clear();
      this.dataSource.filteredData.forEach(user => this.selectedUsers.add(user.id));
    }
    this.allSelected = !this.allSelected; // Toggle button state
  }

  toggleSelection(userId: number) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`http://localhost:3000/api/users/${userId}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }
  editUser(user: any) {
    alert(`Editing user: ${user.name}`);
    // TODO: Implement edit user logic (open modal or navigate to edit page)
  }
}
