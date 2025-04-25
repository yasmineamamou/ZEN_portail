import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class PosteService {
  private baseUrl = 'http://localhost:3000'; // Update with your actual backend URL 
  private apiUrl = 'http://localhost:3000/api/postes';
  constructor(private http: HttpClient) { }

  // Get all postes
  getPostes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  addPoste(poste: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/postes`, poste);
  }

  // Update an existing poste
  updatePoste(id: number, poste: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, poste);
  }

  // Delete a poste
  deletePoste(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadFicheFonction(file: File, id: number): Observable<any> {
    const formData = new FormData();
    formData.append("organigramme", file, file.name); // ✅ Match backend key

    return this.http.post(`${this.baseUrl}/api/upload-fiche-fonction/${id}`, formData);
  }


  updateOrganigramme(file: File, id: number): Observable<any> {
    const formData = new FormData();
    formData.append("organigramme", file, file.name);

    return this.http.post(`${this.baseUrl}/api/upload-fiche-fonction/${id}`, formData); // ✅ Use correct endpoint
  }
}
