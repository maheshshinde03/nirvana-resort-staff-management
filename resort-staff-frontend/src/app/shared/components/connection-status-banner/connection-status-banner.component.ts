import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BackendConnectionService } from '../../../core/services/backend-connection.service';
import { Subject, of } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-connection-status-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="!isBackendConnected" 
      class="connection-banner"
      [@slideDown]
    >
      <div class="banner-content">
        <div class="icon">⚠️</div>
        <div class="message">
          <span class="title">Backend Server Unreachable</span>
          <span class="subtitle">The application server is not responding. Some features may be unavailable. Please ensure the server is running.</span>
        </div>
        <button (click)="retry()" class="retry-btn">Retry Connection</button>
      </div>
    </div>
  `,
  styles: [`
    .connection-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fee 0%, #fdd 100%);
      border-bottom: 2px solid #dc2626;
      padding: 12px 16px;
      animation: slideDown 0.3s ease-out;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .message {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      font-weight: 600;
      color: #b91c1c;
      font-size: 14px;
    }

    .subtitle {
      color: #991b1b;
      font-size: 12px;
      opacity: 0.8;
    }

    .retry-btn {
      padding: 6px 12px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .retry-btn:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(139, 0, 0, 0.2);
    }

    .retry-btn:active {
      transform: translateY(0);
    }

    @media (max-width: 768px) {
      .banner-content {
        flex-direction: column;
        gap: 10px;
      }

      .message {
        order: 2;
      }

      .icon {
        order: 1;
      }

      .retry-btn {
        order: 3;
        width: 100%;
      }
    }
  `]
})
export class ConnectionStatusBannerComponent implements OnInit, OnDestroy {
  isBackendConnected = true;
  private destroy$ = new Subject<void>();

  constructor(
    private connectionService: BackendConnectionService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Check immediately on first load
    this.checkConnection();
    
    // Subscribe to status changes
    this.connectionService.getBackendStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isConnected: any) => {
        console.log('[ConnectionStatusBanner] Backend status:', isConnected);
        this.isBackendConnected = isConnected;
      });
  }

  private checkConnection(): void {
    const apiUrl = 'http://localhost:3000/api/health';
    
    this.http.get(apiUrl).pipe(
      tap(() => {
        console.log('[ConnectionStatusBanner] Immediate check: Backend is connected');
        this.isBackendConnected = true;
      }),
      catchError(() => {
        console.log('[ConnectionStatusBanner] Immediate check: Backend is not responding');
        this.isBackendConnected = false;
        return of(null);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retry(): void {
    // Force a health check
    window.location.reload();
  }
}
