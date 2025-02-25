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
    'poste', 'departement', 'menu_cube', 'role', 'status', 'actions'
  ];

  showEditUserForm = false;
  user: {
    id: number; // Ensure ID is optional
    name: string;
    email: string;
    password: string;
    societe_id: number;
    postes_id: number;
    departement_id: number;
    status: boolean;
    profilePicture: string;
    unites: number[];
    cubes: number[];
    role: string;
  } = {
      id: 0, // Default to undefined for new users
      name: '',
      email: '',
      password: '',
      societe_id: 0,
      postes_id: 0,
      departement_id: 0,
      status: true,
      profilePicture: '',
      unites: [],
      cubes: [],
      role: ''
    };

  selectedUser: any = {
    name: '',
    email: '',
    password: '',
    societe_id: null,
    postes_id: null,
    departement_id: null,
    status: false,
    profilePicture: null,
    role: '',
    unite_ids: [],
    menu_cube_ids: []
  };

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
    postes_id: null,
    unite_ids: [],
    menu_cube_ids: [],
    active: false
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Output() formClosed = new EventEmitter<void>();
  isUpdating: boolean = false;

  constructor(private userService: UserService, private fb: FormBuilder, private dialog: MatDialog) { } // ✅ Use UserService instead of HttpClient

  ngOnInit(): void {
    this.userForm = this.fb.group({
      role: ['', Validators.required],  // Ensure role is part of the form
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      profilePicture: [''],
      societe_id: ['', Validators.required],
      departement_id: ['', Validators.required],
      postes_id: [''],
      unite_ids: [[]],
      menu_cube_ids: [[]],
      active: [true],

    });
    this.loadDropdownData();
    this.loadUsers();
    this.loadSocietes();
    this.loadPostes();
    this.loadCubes();
    this.loadUnites();
    this.userForm.get('role')?.valueChanges.subscribe(value => {
      console.log('Role field updated:', value);
    });
    if (this.isUpdating) {
      console.log("Editing user. Current user object:", this.user);
      if (!this.user?.id) {
        console.error("Error: User ID is missing in this.user.");
      }
    }
  }


  updateFilteredUnites(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredUnites = this.unites.filter(unite => unite.nom.toLowerCase().includes(searchTerm));
  }

  onEditUser() {
    if (!this.selectedUser.name.trim() || !this.selectedUser.email.trim() || !this.selectedUser.societe_id) {
      alert("Le nom, l'email et la société sont requis.");
      return;
    }

    const validRoles = ['admin', 'client', 'super-admin'];
    if (!validRoles.includes(this.selectedUser.role)) {
      alert("Veuillez sélectionner un rôle valide.");
      return;
    }

    const updatedUser = {
      ...this.selectedUser,
      status: this.selectedUser.status ? 1 : 0,
      postes_id: this.selectedUser.postes_id || null, // Ensure it's being sent
      unite_ids: this.selectedUser.unite_ids || [],
      menu_cube_ids: this.selectedUser.menu_cube_ids || []
    };

    console.log("Sending update request with payload:", updatedUser); // Debugging Log

    this.userService.updateUser(this.selectedUser.id, updatedUser)
      .subscribe(
        response => {
          console.log("Update Success:", response);
          this.loadUsers();
          this.showEditUserForm = false;
        },
        error => {
          console.error("Update Error:", error);
          alert("Erreur lors de la mise à jour de l'utilisateur.");
        }
      );
  }

  openEditUserForm(user: any) {
    console.log('User Object from API:', user);
    this.selectedUser = { ...user };

    console.log('Editing User:', this.selectedUser); // ✅ Debugging log
    console.log('Raw Status from API:', user.status);

    // Ensure societe_id is assigned correctly
    const matchingSociete = this.societes.find(s => s.nom === user.societe);
    this.selectedUser.societe_id = matchingSociete ? matchingSociete.id : null;

    // Ensure poste_id is assigned correctly
    const matchingPoste = this.postes.find(p => p.nom === user.postes);
    this.selectedUser.postes_id = matchingPoste ? matchingPoste.id : null;

    // Ensure departement_id is assigned correctly
    const matchingDepartement = this.departements.find(d => d.nom === user.departement);
    this.selectedUser.departement_id = matchingDepartement ? matchingDepartement.id : null;

    this.selectedUser.status = user.status === 1 || user.status === '1' || user.status === true;

    this.selectedUser.unite_ids = user.unites ? user.unites.map((u: any) => u.id) : [];

    // Ensure menu_cube_ids contains only valid IDs
    this.selectedUser.menu_cube_ids = user.menu_cubes ? user.menu_cubes.map((m: any) => m.id) : [];

    console.log('Converted Status (Boolean):', this.selectedUser.status); // Should print `true` or `false`
    console.log('Société ID:', this.selectedUser.societe_id);
    console.log('Poste ID:', this.selectedUser.postes_id);
    console.log('Département ID:', this.selectedUser.departement_id);
    const uniteNames = user.unite ? user.unite.split(',').map((u: string) => u.trim()) : [];
    this.selectedUser.unite_ids = this.unites
      .filter(unite => uniteNames.includes(unite.nom)) // Find matching unites
      .map(unite => unite.id); // Extract only IDs

    // 🛠 Convert Menu Cube Names to IDs
    const menuCubeNames = user.menu_cube ? user.menu_cube.split(',').map((m: string) => m.trim()) : [];
    this.selectedUser.menu_cube_ids = this.menuCubes
      .filter((cube: { id: number; nom: string }) => menuCubeNames.includes(cube.nom))
      .map((cube: { id: number; nom: string }) => cube.id);

    console.log('Processed Unite IDs:', this.selectedUser.unite_ids);
    console.log('Processed Menu Cube IDs:', this.selectedUser.menu_cube_ids);

    // Patch form values
    this.userForm.patchValue({
      unite_ids: this.selectedUser.unite_ids,
      menu_cube_ids: this.selectedUser.menu_cube_ids,
    });
    console.log('Final Form Value:', this.userForm.value);

    this.showEditUserForm = true;

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
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.userForm.patchValue({ profilePicture: this.imagePreview }); // Update the form with the new image
      };
      reader.readAsDataURL(file);
    }
  }
  /* onFileSelecte(event: Event) {
     const file = (event.target as HTMLInputElement).files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onload = () => {
         this.imagePreview = reader.result as string;
         this.userForm.patchValue({ profilePicture: this.imagePreview });
       };
       reader.readAsDataURL(file);
     }
   }*/


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
        alert('User created successfully with Unites and Cubes!');
      }, error => {
        console.error('Error:', error);
        alert('Error creating user');
      });
    } else {
      console.log('Form is invalid');
    }

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
      users.forEach((user: { id: number; }) => {
        this.getCubesForUser(user.id);
        this.getUnitesForUser(user.id);
      });
      this.users = users;

      // Debugging: Check if the missing user is included in the response
      const missingUser = users.find((u: { id: any; }) => u.id === this.selectedUser.id);
      console.log("User after update:", missingUser ? missingUser : "User not found in response!");
    }, error => {
      console.error("Error loading users:", error);

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
    this.showUserForm = false;  // Hide the form
    this.userForm.reset();  // Reset the form fields
    this.selectedUser = null;  // Clear selected user
    this.imagePreview = null;  // Reset profile picture preview
  }

  // ✅ Edit User
  editUser(userId: number) {
    this.userService.getUserById(userId).subscribe(userData => {
      this.user = userData; // Make sure `this.user` is properly set
      this.userForm.patchValue(userData); // Populate form fields
      console.log("User data loaded for editing:", this.user);
    }, error => {
      console.error("Error fetching user:", error);
    });
  }

  // ✅ Close Edit Form
  closeEditForm() {
    this.showEditForm = false;
    this.userForm.reset();
    this.selectedUser = null;
    this.imagePreview = null;
  }
  // ✅ Update User
  onUpdateUser() {
    if (this.userForm.valid) {
      const updatedUser = { ...this.selectedUser, ...this.userForm.value };

      this.userService.updateUser(updatedUser.id, updatedUser).subscribe(
        (response) => {
          console.log('User updated successfully', response);
          this.closeEditForm();
        },
        (error) => {
          console.error('Error updating user:', error);
        }
      );
    }
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