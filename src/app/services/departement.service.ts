import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DepartementService {
    private apiUrl = 'http://localhost:3000/api/departements'; // ✅ API URL
    private baseUrl = 'http://localhost:3000'; // Update with your actual backend URL

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
    uploadOrganigrammeDep(file: File, id: number): Observable<any> {
        const formData = new FormData();
        formData.append("organigramme", file, file.name); // ✅ Match backend key

        return this.http.post(`${this.baseUrl}/api/upload-organigramme-dep/${id}`, formData);
    }

    upload(file: File, id: number): Observable<any> {
        if (!id) {
            console.error("Error: Upload failed because ID is undefined");
            return throwError(() => new Error("ID is undefined"));
        }

        const formData = new FormData();
        formData.append("file", file, file.name);

        const uploadUrl = `${this.baseUrl}/api/upload-organigramme-dep/${id}`;
        console.log("Uploading file to:", uploadUrl, "with file:", file); // Debugging log

        return this.http.post(uploadUrl, formData);
    }
    updateOrganigramme(file: File, id: number): Observable<any> {
        const formData = new FormData();
        formData.append("organigramme", file, file.name);

        return this.http.post(`${this.baseUrl}/api/upload-organigramme-dep/${id}`, formData); // ✅ Use correct endpoint
    }
}

