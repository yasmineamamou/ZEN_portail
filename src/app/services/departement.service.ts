import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DepartementService {
    private apiUrl = 'http://localhost:3000/api/departements'; // ✅ API URL

    constructor(private http: HttpClient) { }

    // ✅ Fetch all Départements
    getDepartements(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    // ✅ Fetch all Sociétés (For Dropdown)
    getSocietes(): Observable<any[]> {
        return this.http.get<any[]>('http://localhost:3000/api/societes');
    }

    // ✅ Add a new Département
    addDepartement(departement: any): Observable<any> {
        return this.http.post(this.apiUrl, departement);
    }

    // ✅ Edit a Département
    updateDepartement(id: number, departement: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, departement);
    }

    // ✅ Delete a Département
    deleteDepartement(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}

