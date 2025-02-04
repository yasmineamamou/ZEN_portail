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
  selectedUser: any = null;
  showEditForm: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  selectedUsers: Set<number> = new Set();
  statusFilter: string = '';
  allSelected = false;
  showUserForm = false;
  userForm!: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) { } // ✅ HttpClient will now work because it's provided globally

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
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;

      // Generate an image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formData = new FormData();
      formData.append('name', this.userForm.value.name);
      formData.append('email', this.userForm.value.email);
      formData.append('password', this.userForm.value.password);
      formData.append('societe', this.userForm.value.societe);
      formData.append('poste', this.userForm.value.poste);
      formData.append('departement', this.userForm.value.departement);
      formData.append('unite', this.userForm.value.unite);
      formData.append('menuCube', this.userForm.value.menuCube);
      formData.append('active', this.userForm.value.active);

      if (this.selectedFile) {
        formData.append('profilePicture', this.selectedFile);
      }

      this.http.post('http://localhost:3000/api/users', formData).subscribe(() => {
        this.loadUsers();
        this.toggleUserForm();
      });
    }
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/api/users').subscribe(data => {
      // ✅ Ensure the image URL is correct
      this.dataSource = new MatTableDataSource(
        data.map(user => ({
          ...user,
          profilePicture: user.profilePicture
            ? `http://localhost:3000${user.profilePicture}`
            : 'assets/IMG_2062.jpg'
        }))
      );

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  toggleUserForm() {
    this.showUserForm = !this.showUserForm; // ✅ Show/Hide form
  }

  closeUserForm(event: Event) {
    if (this.showUserForm) {
      this.showUserForm = false; // ✅ Close form when clicking outside
    }
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
    this.selectedUser = { ...user }; // ✅ Copy user data to edit
    this.showEditForm = true; // ✅ Show the edit modal
    this.userForm.patchValue(this.selectedUser); // ✅ Pre-fill form with user data
  }
  closeEditForm(event: Event) {
    if (this.showEditForm) {
      this.showEditForm = false; // ✅ Hide edit form
    }
  }
  onUpdateUser() {
    if (this.userForm.valid) {
      const updatedUser = { ...this.selectedUser, ...this.userForm.value };

      this.http.put(`http://localhost:3000/api/users/${updatedUser.id}`, updatedUser)
        .subscribe(() => {
          this.loadUsers(); // ✅ Refresh user list
          this.showEditForm = false; // ✅ Close edit form
        });
    }
  }
}
