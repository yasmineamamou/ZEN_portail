import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = 'http://localhost:3000/api/formations';

  constructor(private http: HttpClient) { }

  getFormationsByModule(): Observable<any> {
    return this.http.get(`${this.apiUrl}/grouped-by-module`);
  }
}
