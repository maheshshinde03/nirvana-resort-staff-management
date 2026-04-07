import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { StaffService } from '../../../../core/services/staff.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-attendance-list',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit{

  filterForm! : FormGroup

  attendanceList: any[] = [];
  staffList: any[] = [];
  loading = false;
  errorMsg = '';
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 0;
  private defaultMonth = '';
  private defaultYear = '';

  

  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
    search: [''],
    month: [''],
    year: ['']
  });
  }

  ngOnInit(): void {
    this.loadStaff();

    const last = new Date();
    last.setMonth(last.getMonth() - 1);
    this.defaultMonth = String(last.getMonth() + 1);
    this.defaultYear = String(last.getFullYear());

    this.filterForm.patchValue({
      month: this.defaultMonth,
      year: this.defaultYear
    });

    this.getAttendance();
  }

  /**
   * ✅ Load Staff Dropdown
   */
  loadStaff() {
    this.staffService.getStaff({ limit: 1000 }).subscribe({
      next: (res) => {
        this.staffList = res.data.data;
      }
    });
  }

  /**
   * ✅ Fetch Attendance List
   */
  getAttendance() {
    this.loading = true;
    this.errorMsg = '';

    const raw = this.filterForm.value;
    const filters: any = {
      page: this.page,
      limit: this.limit,
      search: raw.search?.trim() || ''
    };

    if (filters.search) {
      const monthIsDefault = String(raw.month ?? '') === this.defaultMonth;
      const yearIsDefault = String(raw.year ?? '') === this.defaultYear;

      if (monthIsDefault && yearIsDefault) {
        // Search should show full attendance history unless user explicitly changes month/year.
        filters.month = '';
        filters.year = '';
      } else {
        filters.month = raw.month;
        filters.year = raw.year;
      }
    } else {
      filters.month = raw.month;
      filters.year = raw.year;
    }

    this.attendanceService.getAttendance(filters).subscribe({
      next: (res) => {
        this.applyAttendanceResponse(res);
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.message || 'Failed to load attendance';
        this.loading = false;
      }
    });
  }

  /**
   * ✅ Apply Filters
   */
  applyFilters() {
    this.page = 1;
    this.getAttendance();
  }

  /**
   * ✅ Reset Filters
   */
  resetFilters() {
    this.filterForm.reset();
    this.filterForm.patchValue({
      month: this.defaultMonth,
      year: this.defaultYear
    });
    this.page = 1;
    this.getAttendance();
  }

  /**
   * ✅ Salary Calculation (Frontend Preview)
   */
  calculateSalary(att: any) {
    const salary = Number(att.staff?.salary ?? 0);
    const presentDays = Number(att.presentDays ?? 0);

    if (!salary || !presentDays) return 0;

    const perDaySalary = salary / 30;
    return Math.round(perDaySalary * presentDays);
  }

  changePage(page: number) {
    const nextPage = this.clampPage(page);
    if (nextPage === this.page) return;

    this.page = nextPage;
    this.getAttendance();
  }

  get pages(): number[] {
    if (!Number.isFinite(this.totalPages) || this.totalPages <= 1) return [];
    return Array.from({ length: this.totalPages }, (_, idx) => idx + 1);
  }

  private applyAttendanceResponse(res: any) {
    const payload = res?.data ?? res;
    const list = payload?.data;

    const normalized = this.normalizeAttendanceList(Array.isArray(list) ? list : Array.isArray(payload) ? payload : []);

    this.attendanceList = normalized;
    this.total = this.toNumber(payload?.total, normalized.length);
    this.totalPages = Math.max(0, this.toNumber(payload?.totalPages, Math.ceil(this.total / this.limit)));

    // If data shrinks (e.g., filters), ensure current page is valid.
    const clamped = this.clampPage(this.page);
    if (clamped !== this.page) {
      this.page = clamped;
    }
  }

  private normalizeAttendanceList(rawList: any[]): any[] {

    return rawList.map((att: any) => ({
      ...att,
      month: att?.month,
      year: att?.year,
      presentDays: att?.presentDays ?? att?.present_days ?? 0,
      leaveDays: att?.leaveDays ?? att?.leaves ?? 0,
      totalDays: att?.totalDays ?? att?.total_days,
      staff: att?.staff ?? att?.Staff
    }));
  }

  private clampPage(page: number) {
    const p = this.toNumber(page, 1);
    if (this.totalPages && this.totalPages > 0) {
      return Math.min(Math.max(1, p), this.totalPages);
    }
    return Math.max(1, p);
  }

  private toNumber(value: any, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
}
