import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService, NotificationState } from '../../../core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-api-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-alert.component.html',
  styleUrl: './api-alert.component.css',
})
export class ApiAlertComponent {
  readonly state$: Observable<NotificationState | null>;

  constructor(private notify: NotificationService) {
    this.state$ = this.notify.state$;
  }

  dismiss() {
    this.notify.clear();
  }
}

