import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ParametreComponent } from './components/parametre/parametre.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionSocietesComponent } from './components/gestion-societes/gestion-societes.component';
import { GestionDepComponent } from './components/gestion-dep/gestion-dep.component';
import { GestionUnitesComponent } from './components/gestion-unites/gestion-unites.component';
import { GestionPostesComponent } from './components/gestion-postes/gestion-postes.component';
import { GestionCubesComponent } from './components/gestion-cubes/gestion-cubes.component';
import { ModuleComponent } from './components/module/module.component';
import { FormationComponent } from './components/formation/formation.component';
import { GestionFormationComponent } from './components/gestion-formation/gestion-formation.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'parametre', component: ParametreComponent },
    { path: 'gestion-utilisateurs', component: GestionUtilisateursComponent },
    { path: 'gestion-societes', component: GestionSocietesComponent },
    { path: 'gestion-departements', component: GestionDepComponent },
    { path: 'gestion-unites', component: GestionUnitesComponent },
    { path: 'gestion-postes', component: GestionPostesComponent },
    { path: 'gestion-cubes', component: GestionCubesComponent },
    { path: 'module', component: ModuleComponent },
    { path: 'formation', component: FormationComponent },
    { path: 'gestion-formation', component: GestionFormationComponent },
];
