import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ParametreComponent } from './components/parametre/parametre.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionSocietesComponent } from './components/gestion-societes/gestion-societes.component';
import { GestionDepComponent } from './components/gestion-dep/gestion-dep.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'parametre', component: ParametreComponent },
    { path: 'gestion-utilisateurs', component: GestionUtilisateursComponent },
    { path: 'gestion-societes', component: GestionSocietesComponent },
    { path: 'gestion-departements', component: GestionDepComponent },
];
