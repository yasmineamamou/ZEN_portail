import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root' // ✅ Ensures service is globally available
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/users';
    private Url = 'http://localhost:3000';
    private api = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    createUser(userData: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, userData);
    }
    // ✅ Get all users
    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }
    getUser(userId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${userId}`);
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
    getSocietes() {
        return this.http.get<any[]>(`${this.api}/societes`);
    }

    getDepartements(societeId: number) {
        return this.http.get<any[]>(`${this.api}/departements/${societeId}`); // ✅ Correct path
    }


    getPostes() {
        return this.http.get<any[]>(`${this.Url}/postes`);
    }

    getUnites() {
        return this.http.get<any[]>(`${this.Url}/unites`);
    }

    getCubes() {
        return this.http.get<any[]>(`${this.Url}/cubes`);
    }
    getAllDepartements() {
        return this.http.get<any[]>(`${this.api}/departements`); // Fetch all départements
    }
    getUserUnites(userId: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/users/${userId}/unites`);
    }

    getUserCubes(userId: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.api}/users/${userId}/cubes`);
    }
    addUserUnite(userId: number, uniteId: number): Observable<any> {
        return this.http.post<any>(`${this.api}/user_unite`, { user_id: userId, unite_id: uniteId });
    }

    // Step 3: Link User to Cube
    addUserCube(userId: number, cubeId: number): Observable<any> {
        return this.http.post<any>(`${this.api}/user_cube`, { user_id: userId, cube_id: cubeId });
    }
    createUserUnite(userData: any): Observable<any> {
        return this.http.post('http://localhost:3000/api/user_unite', userData);
    }

    createUserCube(userData: any): Observable<any> {
        return this.http.post('http://localhost:3000/api/user_cube', userData);
    }
}
