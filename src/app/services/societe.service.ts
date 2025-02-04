import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root' // ✅ Ensures service is available globally
})
export class SocieteService {
    private apiUrl = 'http://localhost:3000/api/societes';

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
            description: societe.description || null // ✅ Ensure description is not `undefined`
        });
    }


    deleteSociete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}

