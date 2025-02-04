import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Unite {
  id?: number;
  nom: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UniteService {
  private apiUrl = 'http://localhost:3000/unites'; // Adjust this URL based on your backend

  constructor(private http: HttpClient) { }

  // Get all unites
  getUnites(): Observable<Unite[]> {
    return this.http.get<Unite[]>(this.apiUrl);
  }

  // Get a single unite by ID
  getUniteById(id: number): Observable<Unite> {
    return this.http.get<Unite>(`${this.apiUrl}/${id}`);
  }

  // Add a new unite
  addUnite(unite: Unite): Observable<Unite> {
    return this.http.post<Unite>(this.apiUrl, unite);
  }

  // Update an existing unite
  updateUnite(id: number, unite: Unite): Observable<Unite> {
    return this.http.put<Unite>(`${this.apiUrl}/${id}`, unite);
  }

  // Delete a unite
  deleteUnite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
