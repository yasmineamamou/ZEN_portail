import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  private apiUrl = 'http://localhost:3000/api/module';

  constructor(private http: HttpClient) { }
  getModules(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getModuleById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}`);
  }

  addModule(module: any): Observable<any> {
    return this.http.post(this.apiUrl, module);
  }

  updateModule(id: number, module: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, module);
  }

  deleteModule(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
