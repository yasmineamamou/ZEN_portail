import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
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
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [
    FormsModule,
    MatMenuModule,
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
    'select', 'name', 'email', 'password', 'societe', 'unite',
    'poste', 'departement', 'menu_cube', 'date_creation', 'status', 'actions'
  ];
  user = {
    name: '',
    email: '',
    password: '',
    societe_id: 1,
    poste_id: 2,
    departement_id: 3,
    status: 'active',
    profilePicture: '',
    unites: [],
    cubes: [],

    role: '',
  };
  selectedUser: any = null;
  users: any[] = [];

  dataSource = new MatTableDataSource<any>([]);
  showEditForm = false;
  showUserForm = false;
  userForm!: FormGroup;
  filteredUnites: any[] = [];
  searchUnite: string = '';
  selectedSocieteId: number | null = null; // Store selected société_id
  departements: any[] = []; // Store filtered départements
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  selectedUsers: Set<number> = new Set();
  searchMenuCube: string = '';
  filteredMenuCubes: any[] = [];
  allSelected = false;
  statusFilter: string = '';
  societes: any[] = [];
  postes: any[] = [];
  unites: any[] = [];
  menuCubes: any[] = [];
  newUser = {
    role: 'client',
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
  @Output() formClosed = new EventEmitter<void>();

  constructor(private userService: UserService, private fb: FormBuilder, private dialog: MatDialog) { } // ✅ Use UserService instead of HttpClient

  ngOnInit(): void {
    this.userForm = this.fb.group({
      role: ['client'],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      profilePicture: [''],
      societe_id: ['', Validators.required],
      departement_id: ['', Validators.required],
      poste_id: [''],
      unite_ids: [[]],
      menu_cube_ids: [[]],
      active: [true]
    });
    this.loadDropdownData();
    this.loadUsers();
    this.loadSocietes();
    this.loadPostes();
    this.loadCubes();
    this.loadUnites();
  }
  loadDropdownData() {
    this.userService.getSocietes().subscribe(data => this.societes = data);
    this.userService.getAllDepartements().subscribe(data => this.departements = data);
    this.userService.getPostes().subscribe(data => this.postes = data);
    this.userService.getUnites().subscribe(data => {
      this.unites = data;
      this.filteredUnites = data;
    });
    this.userService.getCubes().subscribe(data => {
      this.menuCubes = data;
      this.filteredMenuCubes = data;
    });
  }
  loadUserData(userId: number) {
    this.userService.getUserUnites(userId).subscribe(uniteIds => {
      this.userForm.patchValue({ unite_ids: uniteIds });
    });

    this.userService.getUserCubes(userId).subscribe(cubeIds => {
      this.userForm.patchValue({ menu_cube_ids: cubeIds });
    });
  }
  remindUser(user: any) {
    console.log('🔔 Rappeler:', user);
    alert(`Rappel envoyé à ${user.name}`);
  }

  sendEmail(user: any) {
    console.log('📧 Envoi e-mail:', user);
    alert(`E-mail envoyé à ${user.email}`);
  }
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;

      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  onSubmit() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      formData.role = this.user.role; // Ensure role is included
      formData.status = this.userForm.value.active ? 1 : 0;

      console.log('Final FormData:', formData); // Debugging log 

      this.userService.createUser(formData).subscribe(response => {
        console.log('User created:', response);
        const userId = response.userId;

        formData.unite_ids.forEach((uniteId: number) => {
          this.userService.addUserUnite(userId, uniteId).subscribe(() => {
            console.log(`User ${userId} linked to Unite ${uniteId}`);
          });
        });

        formData.menu_cube_ids.forEach((cubeId: number) => {
          this.userService.addUserCube(userId, cubeId).subscribe(() => {
            console.log(`User ${userId} linked to Cube ${cubeId}`);
          });
        });
        this.loadUsers();
        alert('User created successfully with Unites and Cubes!');
      }, error => {
        console.error('Error:', error);
        alert('Error creating user');
      });
    } else {
      console.log('Form is invalid');
    }
  }
  updateFilteredUnites(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredUnites = this.unites.filter(unite => unite.nom.toLowerCase().includes(query));
  }

  updateFilteredMenuCubes(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredMenuCubes = this.menuCubes.filter(cube => cube.nom.toLowerCase().includes(query));
  }
  loadUnites() {
    this.userService.getUnites().subscribe((data) => {
      this.unites = data;
      this.filteredUnites = [...this.unites]; // Initialize filtered list
    });
  }
  // Handle Individual Unite Selection
  onUniteChange(event: MatCheckboxChange, uniteId: number) {
    const checked = event.checked;
    let currentValues: number[] = this.userForm.value.unite_ids || [];

    if (checked) {
      currentValues.push(uniteId);
    } else {
      currentValues = currentValues.filter(id => id !== uniteId);
    }

    this.userForm.patchValue({ unite_ids: currentValues });
  }

  // Check if a Unite is Selected
  isChecked(uniteId: number): boolean {
    return this.userForm.value.unite_ids?.includes(uniteId);
  }

  // Select or Deselect All Unites
  toggleAllUnites() {
    const allSelected = this.isAllSelected();
    this.userForm.patchValue({ unite_ids: allSelected ? [] : this.unites.map(u => u.id) });
  }

  // Check if All Unites are Selected
  isAllSelected(): boolean {
    return this.unites.length > 0 && this.userForm.value.unite_ids?.length === this.unites.length;
  }


  // ✅ Step 1: Store the selected société_id when user selects a société
  onSocieteSelected() {
    this.selectedSocieteId = this.userForm.value.societe_id; // Store selected société_id
    console.log("🔹 Selected Société ID:", this.selectedSocieteId);
    this.filterDepartements(); // Call method to filter départements
  }

  // ✅ Step 2: Fetch all départements and filter them by selected société_id
  filterDepartements() {
    if (!this.selectedSocieteId) {
      this.departements = [];
      return;
    }

    this.userService.getAllDepartements().subscribe(
      (data) => {
        console.log("🔹 All Departements from API:", data);

        // Convert both societe_id values to numbers before filtering
        this.departements = data.filter(dep => Number(dep.societe_id) === Number(this.selectedSocieteId));

        console.log("✅ Filtered Departements:", this.departements);
      },
      (error) => {
        console.error("❌ Error loading départements:", error);
      }
    );
  }

  selectAllUnites() {
    if (this.isAllSelected()) {
      this.userForm.patchValue({ unite_ids: [] });
    } else {
      this.userForm.patchValue({ unite_ids: this.unites.map(u => u.id) });
    }
  }

  onMenuCubeChange(event: Event, cubeId: number) {
    const checked = (event.target as HTMLInputElement).checked;
    const currentValues: number[] = this.userForm.value.menu_cube_ids || [];

    if (checked) {
      this.userForm.patchValue({ menu_cube_ids: [...currentValues, cubeId] });
    } else {
      this.userForm.patchValue({ menu_cube_ids: currentValues.filter((id: number) => id !== cubeId) });
    }
  }

  // ✅ Load all users
  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      console.log('Loaded Users:', users);
      this.dataSource = new MatTableDataSource(users);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      // Fetch cube and unite names for each user
      users.forEach(user => {
        this.getCubesForUser(user.id);
        this.getUnitesForUser(user.id);
      });
    });
  }
  getUnitesForUser(userId: number) {
    this.userService.getUnitesForUser(userId).subscribe(unites => {
      // Find the user and add `unite` property
      const user = this.dataSource.data.find(u => u.id === userId);
      if (user) {
        user.unite = unites.join(', ');
      }
      // Refresh the table display
      this.dataSource._updateChangeSubscription();
    });
  }
  getCubesForUser(userId: number) {
    this.userService.getCubesForUser(userId).subscribe(cubes => {
      // Find the user and add `menu_cube` property
      const user = this.dataSource.data.find(u => u.id === userId);
      if (user) {
        user.menu_cube = cubes.join(', ');
      }
      // Refresh the table display
      this.dataSource._updateChangeSubscription();
    });
  }
  loadDepartementsBySociete(societeId: number) {
    if (!societeId) {
      this.departements = []; // Clear départements if no société is selected
      return;
    }

    this.userService.getDepartements(societeId).subscribe(
      (data) => {
        console.log('🔹 Departements Loaded:', data);
        this.departements = data; // Populate the dropdown
      },
      (error) => {
        console.error('❌ Error loading départements:', error);
        this.departements = []; // Clear départements on error
      }
    );
  }
  onSocieteChange(societeId: number) {
    this.userService.getDepartements(societeId).subscribe(data => this.departements = data);
  }
  // ✅ Toggle User Form
  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
  }
  // ✅ Close User Form
  closeUserForm() {
    this.showUserForm = false;
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
  openEditUserForm(user: any) {
    this.selectedUser = {
      ...user,
      societe_id: user.societe_id ?? null, // ✅ Ensure societe_id is not undefined
      departement_id: user.departement_id ?? null,
      poste_id: user.poste_id ?? null,
      unite_ids: user.unite_ids ?? [],
      menu_cube_ids: user.menu_cube_ids ?? [],
      active: user.active ?? false
    };
    console.log("🔹 Editing User:", this.selectedUser); // ✅ Debugging log
    if (this.selectedUser.societe_id) {
      this.loadDepartements(this.selectedUser.societe_id);
    }

    this.showEditForm = true;
  }
  // ✅ Delete User
  deleteSelectedUsers() {
    if (this.selectedUsers.size === 0) {
      alert("No users selected for deletion!");
      return;
    }

    if (confirm('Are you sure you want to delete the selected users?')) {
      const userIds = Array.from(this.selectedUsers); // Convert Set to array
      this.userService.deleteUsers(userIds).subscribe(() => {
        this.selectedUsers.clear(); // Clear selection after deletion
        this.loadUsers(); // Refresh the user list
      }, (error) => {
        console.error("Error deleting users:", error);
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

    this.userService.getDepartements(societeId).subscribe(
      data => {
        console.log("🔹 Departements Loaded:", data); // ✅ Debugging log
        this.departements = data;
      },
      error => {
        console.error("❌ Error loading départements:", error);
      }
    );
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

  loadCubes() {
    this.userService.getCubes().subscribe(data => {
      this.menuCubes = data;
      this.filteredMenuCubes = [...this.menuCubes]; // Initialize filtered list
    });
  }

  toggleAllMenuCubes() {
    const allSelected = this.isAllSelectedMenuCubes();
    this.userForm.patchValue({ menu_cube_ids: allSelected ? [] : this.menuCubes.map(c => c.id) });
  }
  isAllSelectedMenuCubes(): boolean {
    return this.menuCubes.length > 0 && this.userForm.value.menu_cube_ids?.length === this.menuCubes.length;
  }
}