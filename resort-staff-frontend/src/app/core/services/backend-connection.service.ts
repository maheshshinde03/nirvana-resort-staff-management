import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of, timer } from 'rxjs';
import { catchError, startWith, switchMap, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendConnectionService {
  private readonly HEALTH_CHECK_INTERVAL = 5000; // Check every 5 seconds
  private readonly HEALTH_CHECK_URL = `${environment.apiUrl}/health`;

  private backendStatusSubject = new BehaviorSubject<boolean>(true);
  backendStatus$ = this.backendStatusSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(status => {
      console.log('[BackendConnectionService] Status changed:', status);
    })
  );

  constructor(private http: HttpClient) {
    this.initHealthCheck();
  }

  private initHealthCheck(): void {
    // Initial check after 1 second, then every 5 seconds
    timer(1000, this.HEALTH_CHECK_INTERVAL)
      .pipe(
        switchMap(() => {
          return this.http.get<any>(this.HEALTH_CHECK_URL, { responseType: 'json' }).pipe(
            tap(() => {
              console.log('[BackendConnectionService] Health check passed');
              this.backendStatusSubject.next(true);
            }),
            catchError((error) => {
              console.log('[BackendConnectionService] Health check failed:', error.status, error.message);
              this.backendStatusSubject.next(false);
              return of(false);
            })
          );
        })
      )
      .subscribe();
  }

  isBackendAvailable(): boolean {
    return this.backendStatusSubject.value;
  }

  getBackendStatus(): Observable<boolean> {
    return this.backendStatus$;
  }
}

