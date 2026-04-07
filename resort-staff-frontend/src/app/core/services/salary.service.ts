import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private API = `${environment.apiUrl}/salary`;

  constructor(private http: HttpClient) {}

  getSalary(paramsObj: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(paramsObj || {}).forEach((key) => {
      const value = paramsObj[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get(this.API, { params });
  }

  /**
   * Save/Update Salary Record
   */
  saveSalary(payload: any): Observable<any> {
    return this.http.post(`${this.API}/save`, payload);
  }

  /**
   * Get Salary List with Filters
   */
  getSalaryList(paramsObj: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(paramsObj || {}).forEach((key) => {
      const value = paramsObj[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get(`${this.API}/list`, { params });
  }
}


