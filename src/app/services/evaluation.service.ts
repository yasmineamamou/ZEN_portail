import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {

  private apiUrl = 'http://localhost:3000/api/evaluation';
  constructor(private http: HttpClient) { }
  createEvaluation(data: any) {
    return this.http.post(this.apiUrl, data);
  }


  getDepartements(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/departements');
  }
  getFormations(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/formations');
  }
  getEvaluations(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/evaluation');
  }


  deleteEvaluation(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/formations/${id}`);
  }
  getEvaluationTypes(): Observable<string[]> {
    return this.http.get<string[]>('http://localhost:3000/api/evaluation-types'); // GET all types
  }

  addEvaluationType(type: string): Observable<any> {
    return this.http.post('http://localhost:3000/api/evaluation-types', { type }); // POST new type
  }
  createQuestion(question: any) {
    return this.http.post('http://localhost:3000/api/questions', question);
  }

  createOption(option: any) {
    return this.http.post('http://localhost:3000/api/question-options', option);
  }
  getEvaluationById(id: number) {
    return this.http.get<any>(`http://localhost:3000/api/evaluation/${id}`);
  }

}
