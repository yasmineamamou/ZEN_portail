import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ParametreComponent } from './components/parametre/parametre.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'parametre', component: ParametreComponent },
    { path: 'gestion-utilisateurs', component: GestionUtilisateursComponent }
];
