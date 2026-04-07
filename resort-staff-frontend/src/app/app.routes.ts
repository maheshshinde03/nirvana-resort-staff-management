import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },

   {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard], // ✅ protect all
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'staff',
        loadChildren: () =>
          import('./features/staff/staff.module').then(m => m.StaffModule)
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('./features/attendance/attendance.module').then(m => m.AttendanceModule)
      },
      {
        path: 'salary',
        loadChildren: () =>
          import('./features/salary/salary.module').then(m => m.SalaryModule)
      }
    ]
  }


];
