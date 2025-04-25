import { AuthService } from './../services/auth.service';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(private router: Router, private authService: AuthService) { }

  navigateToDashboard() {
    this.router.navigate(['/']); // ✅ Navigate to DashboardComponent (path: '')
  }
  logout() {
    this.authService.logout();
  }

}
