import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root' // ✅ Ensures service is globally available
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/users';

    constructor(private http: HttpClient) { }

    // ✅ Get all users
    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    // ✅ Add a new user
    addUser(user: any): Observable<any> {
        const formData = new FormData();
        Object.keys(user).forEach(key => {
            formData.append(key, user[key]);
        });
        return this.http.post(this.apiUrl, formData);
    }

    // ✅ Update a user
    updateUser(id: number, user: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, user);
    }

    // ✅ Delete a user
    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
