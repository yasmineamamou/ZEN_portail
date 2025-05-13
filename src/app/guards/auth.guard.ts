import { AuthService } from './../services/auth.service';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) { }

    canActivate(route: ActivatedRouteSnapshot): boolean {
        // 🧠 1. Always allow SSR phase to render
        if (!isPlatformBrowser(this.platformId)) {
            console.warn("SSR phase – skipping auth guard");
            return true;
        }

        // 🧠 2. Browser phase – do real checks
        const token = this.auth.getToken();
        const role = this.auth.getRole();
        const expectedRole = route.data['role'];

        console.log('👤 AuthGuard | token:', token, '| role:', role, '| expected:', expectedRole);

        // 🔐 No token → go to login
        if (!token) {
            this.router.navigateByUrl('/login');
            return false;
        }

        // 🔐 Token exists but role mismatch → go to login
        if (expectedRole && role !== expectedRole) {
            this.router.navigateByUrl('/login');
            return false;
        }

        return true;
    }
}