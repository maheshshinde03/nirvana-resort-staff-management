import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiAlertComponent } from './shared/components/api-alert/api-alert.component';
import { ConnectionStatusBannerComponent } from './shared/components/connection-status-banner/connection-status-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApiAlertComponent, ConnectionStatusBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'resort-staff-frontend';
}
