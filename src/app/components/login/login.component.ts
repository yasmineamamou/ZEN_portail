import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  email: string = '';
  password: string = '';
  error: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: [''],
      password: ['']
    });
  }
  onLogin() {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        const token = res.token;
        localStorage.setItem('token', token);

        const decoded: any = jwtDecode(token);
        const role = decoded.role;
        localStorage.setItem('role', role);

        this.error = null;
        this.router.navigate(['/dashboard']); // ✅ or any route you want
      },
      error: (err) => {
        this.error = 'Email ou mot de passe incorrect';
        console.error('❌ Login failed:', err);
      }
    });
  }
}