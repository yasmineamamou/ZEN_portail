import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cube {
  id?: number;
  nom: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CubeService {
  private apiUrl = 'http://localhost:3000/cubes';

  constructor(private http: HttpClient) { }

  // Get all cubes
  getCubes(): Observable<Cube[]> {
    return this.http.get<Cube[]>(this.apiUrl);
  }

  // Get a single cube by ID
  getCubeById(id: number): Observable<Cube> {
    return this.http.get<Cube>(`${this.apiUrl}/${id}`);
  }

  // Add a new cube
  addCube(cube: Cube): Observable<Cube> {
    return this.http.post<Cube>(this.apiUrl, cube);
  }

  // Update an existing cube
  updateCube(id: number, cube: Cube): Observable<Cube> {
    return this.http.put<Cube>(`${this.apiUrl}/${id}`, cube);
  }

  // Delete a cube
  deleteCube(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
