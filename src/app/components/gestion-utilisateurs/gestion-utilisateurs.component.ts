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
  societes: any[] = [];
  departements: any[] = [];
  postes: any[] = [];
  unites: any[] = [];
  menuCubes: any[] = [];
  newUser = {
    name: '',
    email: '',
    password: '',
    societe_id: null,
    departement_id: null,
    poste_id: null,
    unite_ids: [],
    menu_cube_ids: [],
    active: false
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private userService: UserService, private fb: FormBuilder) { } // ✅ Use UserService instead of HttpClient

  ngOnInit(): void {
    this.userForm = this.fb.group({
      profil: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      societe_id: ['', Validators.required],
      departement_id: ['', Validators.required],
      poste_id: ['', Validators.required],
      unite_ids: [[]], // For multiple unite
      menu_cube_ids: [[]], // For multiple menu cubes
      active: [false]
    });

    this.loadUsers();
    this.loadSocietes();
    this.loadPostes();
    this.loadCubes();
    this.loadUnites();
  }


  // ✅ Load all users
  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      console.log('Loaded User:', data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }


  onSocieteChange(societeId: number) {
    this.userService.getDepartements(societeId).subscribe(data => this.departements = data);
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
  onAddUser() {
    console.log('Adding User:', this.newUser); // ✅ Debugging log

    if (!this.newUser.name?.trim() || !this.newUser.email?.trim() || !this.newUser.password?.trim() || !this.newUser.societe_id) {
      alert('Nom, email, mot de passe et société sont requis.');
      return;
    }

    this.userService.addUser(this.newUser).subscribe(() => {
      this.loadUsers();
      this.showUserForm = false;
    });
  }
  openEditUserForm(user: any) {
    this.selectedUser = { ...user };
    console.log('Editing User:', this.selectedUser); // ✅ Debugging log

    // Ensure societe_id is assigned correctly
    const matchingSociete = this.societes.find(s => s.nom === user.societe);
    this.selectedUser.societe_id = matchingSociete ? matchingSociete.id : null;

    console.log('Société ID:', this.selectedUser.societe_id); // ✅ Debugging log

    this.loadDepartements(this.selectedUser.societe_id); // Load corresponding departments

    this.showEditForm = true;
  }



  loadSocietes() {
    this.userService.getSocietes().subscribe(data => {
      console.log("🔹 Societes Loaded:", data); // ✅ Debugging log
      this.societes = data.map(societe => ({
        ...societe,
        id: Number(societe.id)
      }));
    });
  }

  loadDepartements(societeId: number) {
    if (!societeId) {
      this.departements = [];
      return;
    }

    this.userService.getDepartements(societeId).subscribe(data => {
      console.log("🔹 Departements Loaded:", data); // ✅ Debugging log
      this.departements = data.map(departement => ({
        ...departement,
        id: Number(departement.id)
      }));
    });
  }

  loadPostes() {
    this.userService.getPostes().subscribe(data => {
      console.log("🔹 Postes Loaded:", data); // ✅ Debugging log
      this.postes = data.map(poste => ({
        ...poste,
        id: Number(poste.id)
      }));
    });
  }

  loadUnites() {
    this.userService.getUnites().subscribe(data => {
      console.log("🔹 Unites Loaded:", data); // ✅ Debugging log
      this.unites = data.map(unite => ({
        ...unite,
        id: Number(unite.id)
      }));
    });
  }

  loadCubes() {
    this.userService.getCubes().subscribe(data => {
      console.log("🔹 Menu Cubes Loaded:", data); // ✅ Debugging log
      this.menuCubes = data.map(cube => ({
        ...cube,
        id: Number(cube.id)
      }));
    });
  }


}