import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { BackendConnectionService } from '../services/backend-connection.service';

/**
 * Extract message from various response formats
 */
const toMessage = (payload: any): string => {
  if (!payload) return '';

  // Try different message field names
  let msg = payload?.message || payload?.msg || payload?.error;

  // If it's an object with nested message, try to extract it
  if (typeof msg === 'object' && msg !== null) {
    msg = msg?.message || msg?.msg || JSON.stringify(msg);
  }

  // Handle empty message
  if (!msg) return '';

  // Handle array of messages (validation errors)
  if (Array.isArray(msg)) {
    return msg.filter(Boolean).map(String).join(', ');
  }

  // Convert to string
  if (typeof msg === 'string') {
    const trimmed = msg.trim();
    return trimmed || '';
  }

  // Fallback to JSON stringify
  try {
    return JSON.stringify(msg).trim() || '';
  } catch {
    return String(msg).trim() || '';
  }
};

export const apiMessageInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const connectionService = inject(BackendConnectionService);

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse)) return;

      const body: any = event.body;
      const message = toMessage(body);
      if (!message) return;

      const method = String(req.method || 'GET').toUpperCase();
      const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

      if (body?.success === false) {
        notify.error(message);
        return;
      }

      if (isMutating) {
        notify.success(message);
      }
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Network error (status 0) - backend is unreachable
        if (err.status === 0) {
          // Skip showing error for health check endpoint to avoid notification spam
          if (!req.url.includes('/health')) {
            const message = 'Backend server is not responding. Please ensure the server is running.';
            notify.error(message);
          }
          return throwError(() => err);
        }

        // Try to extract message from error response
        const message = toMessage(err.error) || toMessage({ message: err.message }) || 'Request failed';
        if (message && message !== 'Request failed') {
          notify.error(message);
        } else {
          // Fallback to HTTP status message
          const statusMessage = `${err.status} ${err.statusText || 'Error'}`;
          notify.error(statusMessage);
        }
        return throwError(() => err);
      }

      notify.error('Request failed');
      return throwError(() => err);
    }),
  );
};

