import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = 'http://localhost:3000/api/formations';
  private baseUrl = 'http://localhost:3000';
  private api = 'http://localhost:3000/api';
  constructor(private http: HttpClient) { }


  getFormation(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getFormationById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}`);
  }

  addFormation(formation: any): Observable<any> {
    return this.http.post(this.apiUrl, formation);
  }

  updateFormation(id: number, formation: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formation);
  }


  deleteFormation(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/formations/${id}`);
  }

  uploadOrganigrammeFormation(file: File, id: number): Observable<any> {
    const formData = new FormData();
    formData.append("organigramme", file, file.name); // ✅ Match backend key

    return this.http.post(`${this.baseUrl}/api/upload-formation/${id}`, formData);
  }
  getModule() {
    return this.http.get<any[]>(`${this.api}/module`);
  }

  addFormationModule(formationId: number, moduleId: number): Observable<any> {
    return this.http.post(`http://localhost:3000/api/formation_module`, {
      formation_id: formationId,
      module_id: moduleId
    });
  }

  createFormationModule(formationData: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/formation_module', formationData);
  }


  linkModuleToFormation(formationId: number, moduleId: number): Observable<any> {
    return this.http.post(`${this.api}/formation_module`, { formation_id: formationId, module_id: moduleId });
  }
  addFormationWithFile(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/api/formations', formData);
  }
  addFormationDepartement(formationId: number, departementId: number): Observable<any> {
    return this.http.post('http://localhost:3000/api/formation_departement', { formation_id: formationId, departement_id: departementId });
  }
  getDepartements(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/departements');
  }
  getFormationModules(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/formation_module');
  }

  getFormationDepartements() {
    return this.http.get<any[]>('http://localhost:3000/api/formation_departement');
  }
  getFormationsByFileType(type: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/formations/type/${type}`);
  }

}
