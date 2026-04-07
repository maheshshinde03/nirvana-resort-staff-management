import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationState {
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new BehaviorSubject<NotificationState | null>(null);
  readonly state$ = this.subject.asObservable();

  private clearTimer: number | null = null;

  success(message: string, durationMs = 4000) {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 6000) {
    this.show('error', message, durationMs);
  }

  info(message: string, durationMs = 4000) {
    this.show('info', message, durationMs);
  }

  warning(message: string, durationMs = 5000) {
    this.show('warning', message, durationMs);
  }

  clear() {
    if (this.clearTimer) {
      window.clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
    this.subject.next(null);
  }

  private show(type: NotificationType, message: string, durationMs: number) {
    // Normalize message - remove all whitespace, newlines, etc
    let normalized = String(message ?? '').trim();
    
    // If message is still empty after trimming, don't show
    if (!normalized || normalized.length === 0) {
      console.warn(`[NotificationService] Empty message for type: ${type}`);
      return;
    }

    // Clear any existing timer
    if (this.clearTimer) {
      window.clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    // Emit the notification
    this.subject.next({ type, message: normalized });

    // Set auto-dismiss timer if duration is specified
    if (durationMs > 0) {
      this.clearTimer = window.setTimeout(() => {
        this.subject.next(null);
        this.clearTimer = null;
      }, durationMs);
    }
  }
}

