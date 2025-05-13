
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
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'parametre', component: ParametreComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-utilisateurs', component: GestionUtilisateursComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-societes', component: GestionSocietesComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-departements', component: GestionDepComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-unites', component: GestionUnitesComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-postes', component: GestionPostesComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-cubes', component: GestionCubesComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'module', component: ModuleComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'formation', component: FormationComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'gestion-formation', component: GestionFormationComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    {
        path: 'evaluation', component: EvaluationComponent, canActivate: [AuthGuard],
        data: { role: 'admin' }
    },
    { path: 'login', component: LoginComponent },

    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }, // update with your actual component

    { path: '', redirectTo: 'login', pathMatch: 'full' },

    { path: 'unauthorized', redirectTo: 'login', pathMatch: 'full' },

];
