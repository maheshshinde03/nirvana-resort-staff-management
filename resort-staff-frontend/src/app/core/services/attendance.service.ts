import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

    private API = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  createAttendance(data: any): Observable<any> {
    return this.http.post(this.API, data);
  }

  getAttendance(params: any): Observable<any> {
    return this.http.get(this.API, { params });
  }

  getAttendanceById(id: number): Observable<any> {
    return this.http.get(`${this.API}/${id}`);
  }

  updateAttendance(id: number, data: any): Observable<any> {
    return this.http.put(`${this.API}/${id}`, data);
  }

  deleteAttendance(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
