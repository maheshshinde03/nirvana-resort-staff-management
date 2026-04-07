import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { SalaryService } from '../../../../core/services/salary.service';
import { StaffService } from '../../../../core/services/staff.service';
import { CategoryLabelPipe } from '../../../../shared/pipes/category-label.pipe';

@Component({
  selector: 'app-salary',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CategoryLabelPipe],
  templateUrl: './salary.component.html',
  styleUrl: './salary.component.css'
})
export class SalaryComponent implements OnInit, OnDestroy {
  loading = false;
  errorMsg = '';
  employeeId: string = ''; // Store enterprise employee ID (Emp-1, etc)

  company = {
    name: 'Nirvana Resort',
    address: 'Dahivad Village, Near Urmodi Dam, Satara 415003',
    mobile: 'Mobile No: +917977551983'
  };

  logoPath = './logo.jpg';

  salaryData: any | null = null;
  form!: FormGroup;

  finalized = false;

  private linking = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private salaryService: SalaryService,
    private attendanceService: AttendanceService,
    private staffService: StaffService
  ) {
    this.form = this.fb.group({
      staff_id: ['', Validators.required],
      month: ['', Validators.required],
      year: ['', Validators.required],
      totalDays: [{ value: 30, disabled: true }],
      basicSalary: [{ value: 0, disabled: true }],
      salaryPerDay: [{ value: 0, disabled: true }],
      present_days: [0, [Validators.required, Validators.min(0)]],
      leaves: [0, [Validators.required, Validators.min(0)]],
      deduction: [{ value: 0, disabled: true }],
      totalSalary: [0, [Validators.required, Validators.min(0)]],
      autoCalculate: [true]
    });
  }

  ngOnInit(): void {
    // Subscribe to query parameters to handle navigation changes
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((qp) => {
        console.log('📥 Query params received:', qp);
        
        const staffId = qp['staffId'];
        const month = qp['month'];
        const year = qp['year'];
        const presentDays = qp['presentDays'];
        const leaveDays = qp['leaveDays'];

        console.log(`📋 Extracted values - staffId: ${staffId}, month: ${month}, year: ${year}`);

        // Convert month number to month name if numeric
        let monthValue = month;
        if (month) {
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const monthIndex = Number(month) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthValue = monthNames[monthIndex];
            console.log(`📅 Converted month ${month} to ${monthValue}`);
          }
        }

        this.form.patchValue({
          ...(staffId ? { staff_id: Number(staffId) } : {}),
          ...(monthValue ? { month: monthValue } : {}),
          ...(year ? { year: Number(year) } : {}),
          ...(presentDays ? { present_days: Number(presentDays) } : {}),
          ...(leaveDays ? { leaves: Number(leaveDays) } : {}),
        });

        console.log('✏️ Form patched with values');

        this.bindLinking();
        setTimeout(() => {
          console.log('⏱️ Calling loadSalary after 100ms');
          this.loadSalary();
        }, 100);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get staff_id() {
    return Number(this.form.get('staff_id')?.value);
  }

  loadSalary() {
    if (this.form.invalid) {
      this.errorMsg = 'Missing staff/month/year';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const params = {
      staff_id: this.staff_id,
      month: this.form.get('month')?.value,
      year: this.form.get('year')?.value
    };

    this.salaryService
      .getSalary(params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          this.salaryData = res;

          // Fetch staff record to get the enterprise employee ID (Emp-1 format)
          const numericStaffId = Number(res?.staff_id);
          if (numericStaffId) {
            this.staffService.getStaffById(numericStaffId).subscribe({
              next: (staffRes: any) => {
                this.employeeId = staffRes?.data?.staff_id ?? ''; // Get Emp-1 format
              },
              error: () => {
                this.employeeId = ''; // Fallback if staff fetch fails
              }
            });
          }

          const basicSalary = Number(res?.basic_salary ?? 0) || 0;
          const salaryPerDay = Number(res?.salary_per_day ?? 0) || (basicSalary ? basicSalary / 30 : 0);
          const totalDays = 30;
          const present = Number(res?.present_days ?? 0);
          const leave = Number(res?.leave_days ?? 0);
          const deduction = Number(res?.deduction ?? 0) || salaryPerDay * leave;
          const computedTotalSalary = Number(res?.final_salary ?? 0) || Math.max(0, basicSalary - deduction);

          this.form.patchValue(
            {
              staff_id: Number(res?.staff_id ?? this.staff_id),
              month: res?.month ?? this.form.get('month')?.value,
              year: Number(res?.year ?? this.form.get('year')?.value),
              totalDays,
              basicSalary,
              salaryPerDay,
              present_days: Number.isFinite(present) ? present : 0,
              leaves: Number.isFinite(leave) ? leave : 0,
              deduction,
              totalSalary: computedTotalSalary
            },
            { emitEvent: false }
          );

          this.recalculateTotals();
        },
        error: (err: any) => {
          this.salaryData = null;
          this.errorMsg = err?.error?.message || 'Failed to load salary';
        }
      });
  }

  toggleFinalize() {
    this.finalized = !this.finalized;

    const controls = ['present_days', 'leaves', 'totalSalary', 'autoCalculate'];
    controls.forEach((key) => {
      const ctrl = this.form.get(key);
      if (!ctrl) return;
      if (this.finalized) ctrl.disable({ emitEvent: false });
      else ctrl.enable({ emitEvent: false });
    });
  }

  saveAttendance() {
    const attendanceId = Number(this.salaryData?.attendance_id);
    if (!attendanceId || Number.isNaN(attendanceId)) {
      this.errorMsg = 'Attendance record not found for this month';
      return;
    }

    const payload = {
      present_days: Number(this.form.get('present_days')?.value),
      leaves: Number(this.form.get('leaves')?.value),
      total_days: 30
    };

    this.loading = true;
    this.errorMsg = '';
    this.attendanceService
      .updateAttendance(attendanceId, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          // 🔥 After attendance is saved, also save the salary record
          this.saveSalaryRecord();
        },
        error: (err: any) => {
          this.errorMsg = err?.error?.message || 'Failed to save attendance';
        }
      });
  }

  /**
   * Save Salary Record to Database
   */
  saveSalaryRecord() {
    const payload = {
      staff_id: this.staff_id,
      month: this.form.get('month')?.value,
      year: Number(this.form.get('year')?.value),
      total_days: 30,
      present_days: Number(this.form.get('present_days')?.value),
      leave_days: Number(this.form.get('leaves')?.value),
      status: 'PENDING'
    };

    this.salaryService.saveSalary(payload).subscribe({
      next: () => {
        // Reload salary data to reflect changes
        this.loadSalary();
      },
      error: (err: any) => {
        console.error('Error saving salary:', err);
        // Don't show error to user - attendance was already saved
      }
    });
  }

  printSlip() {
    // Give the page a moment to render completely before printing
    setTimeout(() => {
      window.print();
    }, 500);
  }

  private bindLinking() {
    const presentCtrl = this.form.get('present_days');
    const leaveCtrl = this.form.get('leaves');
    const autoCtrl = this.form.get('autoCalculate');

    presentCtrl?.valueChanges.subscribe((v) => {
      if (this.linking) return;
      this.linking = true;
      const present = Math.max(0, Number(v) || 0);
      const leave = Math.max(0, 30 - present);
      leaveCtrl?.setValue(leave, { emitEvent: false });
      this.linking = false;
      if (autoCtrl?.value) this.recalculateTotals();
    });

    leaveCtrl?.valueChanges.subscribe((v) => {
      if (this.linking) return;
      this.linking = true;
      const leave = Math.max(0, Number(v) || 0);
      const present = Math.max(0, 30 - leave);
      presentCtrl?.setValue(present, { emitEvent: false });
      this.linking = false;
      if (autoCtrl?.value) this.recalculateTotals();
    });

    autoCtrl?.valueChanges.subscribe((auto) => {
      if (auto) this.recalculateTotals();
    });
  }

  private recalculateTotals() {
    const basicSalary = Number(this.form.get('basicSalary')?.value) || 0;
    const perDay = basicSalary / 30;
    const leave = Number(this.form.get('leaves')?.value) || 0;
    const deduction = Math.max(0, perDay * leave);
    const totalSalary = Math.max(0, basicSalary - deduction);

    this.form.patchValue(
      {
        salaryPerDay: perDay,
        deduction,
        totalSalary
      },
      { emitEvent: false }
    );
  }
}
