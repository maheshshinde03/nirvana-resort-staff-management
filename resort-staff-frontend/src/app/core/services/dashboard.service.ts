import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

    private API = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>(`${this.API}/stats`);
  }

  getMonthlySalary() {
    return this.http.get<any>(`${this.API}/salary-monthly`);
  }

  getAttendanceSummary() {
    return this.http.get<any>(`${this.API}/attendance-summary`);
  }
}
