import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Poste {
  id?: number;
  nom: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PosteService {
  private apiUrl = 'http://localhost:3000/postes';

  constructor(private http: HttpClient) { }

  // Get all postes
  getPostes(): Observable<Poste[]> {
    return this.http.get<Poste[]>(this.apiUrl);
  }

  // Get a single poste by ID
  getPosteById(id: number): Observable<Poste> {
    return this.http.get<Poste>(`${this.apiUrl}/${id}`);
  }

  // Add a new poste
  addPoste(poste: Poste): Observable<Poste> {
    return this.http.post<Poste>(this.apiUrl, poste);
  }

  // Update an existing poste
  updatePoste(id: number, poste: Poste): Observable<Poste> {
    return this.http.put<Poste>(`${this.apiUrl}/${id}`, poste);
  }

  // Delete a poste
  deletePoste(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
