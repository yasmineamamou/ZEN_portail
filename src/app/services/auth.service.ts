import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:3000/api';
  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      return true;
    }
    return false;
  }


  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
