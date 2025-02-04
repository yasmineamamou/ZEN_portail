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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSortModule } from '@angular/material/sort';
import { UserService } from '../../services/utilisateur.service';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [
    FormsModule,
    MatSlideToggleModule,
    MatRadioModule,
    CommonModule,
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
  ],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.css']
})
export class GestionUtilisateursComponent implements OnInit {
  displayedColumns: string[] = [
    'name', 'email', 'password', 'societe', 'unite',
    'poste', 'departement', 'menu_cube', 'date_creation', 'status', 'actions'
  ];
  dataSource = new MatTableDataSource<any>([]);
  selectedUser: any = null;
  showEditForm = false;
  showUserForm = false;
  userForm!: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  selectedUsers: Set<number> = new Set();
  allSelected = false;
  statusFilter: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private userService: UserService, private fb: FormBuilder) { } // ✅ Use UserService instead of HttpClient

  ngOnInit(): void {
    this.userForm = this.fb.group({
      profil: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      societe: ['', Validators.required],
      poste: ['', Validators.required],
      departement: ['', Validators.required],
      unite: ['', Validators.required],
      menuCube: [''], // ✅ Not required
      active: [false]
    });

    this.loadUsers();
  }

  // ✅ Load all users
  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  // ✅ Handle File Selection
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ Toggle User Form
  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
  }

  // ✅ Close User Form
  closeUserForm() {
    this.showUserForm = false;
  }

  // ✅ Add User
  onSubmit() {
    if (this.userForm.valid) {
      const newUser = { ...this.userForm.value, profilePicture: this.selectedFile };
      this.userService.addUser(newUser).subscribe(() => {
        this.loadUsers();
        this.toggleUserForm();
      });
    }
  }

  // ✅ Edit User
  editUser(user: any) {
    this.selectedUser = { ...user };
    this.showEditForm = true;
    this.userForm.patchValue(this.selectedUser);
  }

  // ✅ Close Edit Form
  closeEditForm() {
    this.showEditForm = false;
  }

  // ✅ Update User
  onUpdateUser() {
    if (this.userForm.valid) {
      const updatedUser = { ...this.selectedUser, ...this.userForm.value };
      this.userService.updateUser(updatedUser.id, updatedUser).subscribe(() => {
        this.loadUsers();
        this.showEditForm = false;
      });
    }
  }

  // ✅ Delete User
  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe(() => {
        this.loadUsers();
      });
    }
  }
  toggleSelectAllUsers() {
    if (this.allSelected) {
      this.selectedUsers.clear(); // ✅ Deselect all
    } else {
      this.selectedUsers.clear();
      this.dataSource.filteredData.forEach(user => this.selectedUsers.add(user.id));
    }
    this.allSelected = !this.allSelected;
  }

  // ✅ Toggle Selection for a Single User
  toggleSelection(userId: number) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  // ✅ Filter by Status
  applyStatusFilter(filterValue: string) {
    this.statusFilter = filterValue;
    this.dataSource.filterPredicate = (data, filter) => {
      return filter === '' || data.status === filter;
    };
    this.dataSource.filter = filterValue;
  }

  // ✅ Apply Search Filter
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
}