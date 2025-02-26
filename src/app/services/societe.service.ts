import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root' // ✅ Ensures service is available globally
})
export class SocieteService {
    private apiUrl = 'http://localhost:3000/api/societes';
    private baseUrl = 'http://localhost:3000'; // Update with your actual backend URL 
    constructor(private http: HttpClient) { }

    getSocietes(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    addSociete(societe: any): Observable<any> {
        return this.http.post(this.apiUrl, societe);
    }
    updateSociete(id: number, societe: any): Observable<any> {
        if (!id || !societe.nom) {
            console.error('Invalid Update Data:', societe);
            return throwError(() => new Error('Invalid data for update'));
        }

        return this.http.put(`${this.apiUrl}/${id}`, {
            nom: societe.nom,
            description: societe.description || null, // ✅ Ensure description is not `undefined`
            rne: societe.rne,
            pays: societe.pays,
            adresse: societe.adresse,
            Type: societe.Type
        });
    }


    deleteSociete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    uploadOrganigramme(id: number, file: File) {
        const formData = new FormData();
        formData.append('organigramme', file);
        console.log("societe ID ", id);
        return this.http.post(`http://localhost:3000/api/societes/${id}/upload-organigramme`, formData);
    }
    upload(file: File, id: number): Observable<any> {
        if (!id) {
            console.error("Error: Upload failed because ID is undefined");
            return throwError(() => new Error("ID is undefined"));
        }

        const formData = new FormData();
        formData.append("file", file, file.name);

        const uploadUrl = `${this.baseUrl}/api/upload-organigramme/${id}`;
        console.log("Uploading file to:", uploadUrl, "with file:", file); // Debugging log

        return this.http.post(uploadUrl, formData);
    }
    updateOrganigramme(file: File, id: number): Observable<any> {
        const formData = new FormData();
        formData.append("file", file, file.name);

        return this.http.post(`${this.baseUrl}/api/upload-organigramme/${id}`, formData); // ✅ Use correct endpoint
    }
}

