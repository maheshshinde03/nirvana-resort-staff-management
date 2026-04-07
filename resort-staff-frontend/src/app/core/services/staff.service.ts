import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffService {

  private API = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ Get Staff List (with query params)
   */
  getStaff(paramsObj: any): Observable<any> {
    let params = new HttpParams();

    Object.keys(paramsObj).forEach(key => {
      if (paramsObj[key] !== undefined && paramsObj[key] !== null) {
        params = params.set(key, paramsObj[key]);
      }
    });

    return this.http.get(this.API, { params });
  }

  /**
   * ✅ Create Staff
   */
  createStaff(data: any): Observable<any> {
    return this.http.post(this.API, data);
  }

  /**
   * ✅ Update Staff
   */
  updateStaff(id: number, data: any): Observable<any> {
    return this.http.put(`${this.API}/${id}`, data);
  }

  /**
   * ✅ Delete Staff
   */
  deleteStaff(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  /**
   * ✅ Get Single Staff (extra - useful)
   */
  getStaffById(id: number): Observable<any> {
    return this.http.get(`${this.API}/${id}`);
  }
}