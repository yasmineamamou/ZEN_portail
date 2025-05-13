import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:3000/api';
  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) { }


  login(credentials: any): Observable<any> {
    return this.http.post('http://localhost:3000/login', credentials).pipe(
      tap((res: any) => {
        const token = res.token;

        // ✅ Store token
        localStorage.setItem('token', token);

        // ✅ Decode token to get role
        const decoded: any = jwtDecode(token);
        const role = decoded.role;


        // ✅ Store role
        localStorage.setItem('role', role);
      })
    );
  }
  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }
  getRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
