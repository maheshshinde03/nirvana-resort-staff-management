import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DashboardService } from '../../../../core/services/dashboard.service';

type KpiCard = {
  key: string;
  label: string;
  value: string;
  sub: string;
  accent: 'accent-blue' | 'accent-green' | 'accent-amber' | 'accent-violet';
  icon: 'users' | 'userCheck' | 'wallet' | 'calendarCheck';
};

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, BaseChartDirective, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  loading = false;
  errorMsg = '';
  lastUpdated: Date | null = null;

  kpis: KpiCard[] = [];
  skeletonKpis = Array.from({ length: 4 });

  salaryChartData: any;
  attendanceChartData: any;

  salaryChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(100, 116, 139, 0.18)' }, ticks: { precision: 0 } },
    },
  };

  attendanceChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
    },
  };

  private readonly inrFmt = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  private readonly numFmt = new Intl.NumberFormat('en-IN');

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  trackByKpi(_index: number, item: KpiCard) {
    return item.key;
  }

  loadDashboard() {
    this.loading = true;
    this.errorMsg = '';

    forkJoin({
      stats: this.dashboardService.getStats().pipe(catchError((err) => {
        console.error('Stats load error:', err);
        return of(null);
      })),
      salary: this.dashboardService.getMonthlySalary().pipe(catchError((err) => {
        console.error('Salary load error:', err);
        return of(null);
      })),
      attendance: this.dashboardService.getAttendanceSummary().pipe(catchError((err) => {
        console.error('Attendance load error:', err);
        return of(null);
      })),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe((res) => {
        if (!res.stats || !res.salary || !res.attendance) {
          const missing = [];
          if (!res.stats) missing.push('stats');
          if (!res.salary) missing.push('salary');
          if (!res.attendance) missing.push('attendance');
          
          this.errorMsg = `Failed to load dashboard data. Unable to retrieve: ${missing.join(', ')}. Please check if the server is running.`;
          return;
        }

        this.stats = res.stats.data;
        this.lastUpdated = new Date();
        this.buildKpis();
        this.prepareSalaryChart(res.salary.data || []);
        this.prepareAttendanceChart(res.attendance.data || { present: 0, leave: 0 });
      });
  }

  prepareSalaryChart(data: any[]) {
    const labels = (data || []).map((d) => d.month);
    const values = (data || []).map((d) => d.totalSalary);

    this.salaryChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Monthly Salary',
          backgroundColor: 'rgba(37, 99, 235, 0.32)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 10,
          hoverBackgroundColor: 'rgba(37, 99, 235, 0.46)',
        },
      ],
    };
  }

  prepareAttendanceChart(data: any) {
    this.attendanceChartData = {
      labels: ['Present', 'Leave'],
      datasets: [
        {
          data: [data.present, data.leave],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(245, 158, 11, 0.85)'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
    };
  }

  private buildKpis() {
    const totalStaff = this.toNumber(this.stats?.totalStaff) ?? 0;
    const activeStaff = this.toNumber(this.stats?.activeStaff) ?? 0;
    const lastMonthSalary = this.toNumber(this.stats?.lastMonthSalary) ?? 0;
    const lastMonthAttendance = this.toNumber(this.stats?.lastMonthAttendance) ?? 0;

    const activePct = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

    this.kpis = [
      {
        key: 'totalStaff',
        label: 'Total Staff',
        value: this.numFmt.format(totalStaff),
        sub: 'All employees in the system',
        accent: 'accent-blue',
        icon: 'users',
      },
      {
        key: 'activeStaff',
        label: 'Active Staff',
        value: this.numFmt.format(activeStaff),
        sub: `${this.numFmt.format(activePct)}% currently active`,
        accent: 'accent-green',
        icon: 'userCheck',
      },
      {
        key: 'lastMonthSalary',
        label: 'Last Month Total Salary',
        value: this.inrFmt.format(lastMonthSalary),
        sub: 'Payroll total for all staff',
        accent: 'accent-violet',
        icon: 'wallet',
      },
      {
        key: 'lastMonthAttendance',
        label: 'Last Month Attendance',
        value: this.numFmt.format(lastMonthAttendance),
        sub: 'Total present days by all staff',
        accent: 'accent-amber',
        icon: 'calendarCheck',
      },
    ];
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value.replace(/,/g, ''));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
}
