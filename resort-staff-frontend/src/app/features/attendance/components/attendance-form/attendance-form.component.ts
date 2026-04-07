import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { StaffService } from '../../../../core/services/staff.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-attendance-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './attendance-form.component.html',
  styleUrl: './attendance-form.component.css',
})
export class AttendanceFormComponent implements OnInit {
  staffList: any[] = [];
  loading = false;
  errorMsg = '';
  selectedStaff: any | null = null;
  minYear: number | null = null;
  minMonth: number | null = null;
  maxYear: number | null = null;
  maxMonth: number | null = null;

  attendanceForm!: FormGroup;

  private notify = inject(NotificationService);

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private staffService: StaffService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.attendanceForm = this.fb.group({
    staff_id: ['', Validators.required],
    month: ['', Validators.required],
    year: ['', Validators.required],
    present_days: [0, [Validators.required, Validators.min(1)]],
    leaves: [0, Validators.min(0)],
    leave_reason: [''],
  });
  }

  ngOnInit(): void {
    this.loadStaff();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDate = now.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Calculate max allowed month/year for attendance submission
    // Allow current month only if today is the last day, otherwise allow previous month
    if (currentDate === lastDayOfMonth) {
      this.maxMonth = currentMonth;
      this.maxYear = currentYear;
    } else {
      // Set to previous month
      if (currentMonth === 1) {
        this.maxMonth = 12;
        this.maxYear = currentYear - 1;
      } else {
        this.maxMonth = currentMonth - 1;
        this.maxYear = currentYear;
      }
    }

    const defaults = {
      month: this.maxMonth,
      year: this.maxYear,
    };

    this.attendanceForm.patchValue(defaults);

    const qp = this.route.snapshot.queryParamMap;
    const staffId = qp.get('staffId');
    const month = qp.get('month');
    const year = qp.get('year');
    const leaveDays = qp.get('leaveDays');
    const presentDays = qp.get('presentDays');

    this.attendanceForm.patchValue({
      ...(staffId ? { staff_id: Number(staffId) } : {}),
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
      ...(leaveDays ? { leaves: Number(leaveDays) } : {}),
      ...(presentDays ? { present_days: Number(presentDays) } : {}),
    });

    this.attendanceForm.get('staff_id')?.valueChanges.subscribe(() => {
      this.syncSelectedStaff();
      this.enforceJoiningDate();
    });

    this.attendanceForm.get('year')?.valueChanges.subscribe(() => {
      this.enforceJoiningDate();
    });

    this.attendanceForm.get('month')?.valueChanges.subscribe(() => {
      this.enforceJoiningDate();
    });

    this.syncSelectedStaff();
    this.enforceJoiningDate();
  }

  loadStaff() {
    this.staffService.getStaff({ limit: 1000, status: 'ACTIVE' }).subscribe({
      next: (res) => {
        this.staffList = res.data.data;
        this.syncSelectedStaff();
        this.enforceJoiningDate();
      },
    });
  }

  onSubmit() {

    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const raw = this.attendanceForm.value;
    const total_days = 30;
    const payload = {
      ...raw,
      total_days
    };

    this.attendanceService.createAttendance(payload).subscribe({
        next: () => {
          this.loading = false;
          this.attendanceForm.reset();
          this.router.navigate(['/attendance']);
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private syncSelectedStaff() {
    const id = Number(this.attendanceForm.get('staff_id')?.value);
    if (!id || Number.isNaN(id)) {
      this.selectedStaff = null;
      this.minYear = null;
      this.minMonth = null;
      return;
    }

    // Find staff by id (database primary key)
    this.selectedStaff = this.staffList.find((s) => Number(s?.id) === id) ?? null;

    const joinDateRaw = this.selectedStaff?.joining_date ?? this.selectedStaff?.joiningDate;
    if (!joinDateRaw) {
      this.minYear = null;
      this.minMonth = null;
      return;
    }

    const join = new Date(joinDateRaw);
    if (Number.isNaN(join.getTime())) {
      this.minYear = null;
      this.minMonth = null;
      return;
    }

    this.minYear = join.getFullYear();
    this.minMonth = join.getMonth() + 1;
  }

  private enforceJoiningDate() {
    if (!this.minYear || !this.minMonth) return;

    const yearCtrl = this.attendanceForm.get('year');
    const monthCtrl = this.attendanceForm.get('month');
    if (!yearCtrl || !monthCtrl) return;

    const y = Number(yearCtrl.value);
    const m = Number(monthCtrl.value);

    if (!y || Number.isNaN(y)) return;

    if (y < this.minYear) {
      yearCtrl.setValue(this.minYear, { emitEvent: false });
      return;
    }

    if (y === this.minYear && m && !Number.isNaN(m) && m < this.minMonth) {
      monthCtrl.setValue(this.minMonth, { emitEvent: false });
    }
  }

  isMonthDisabled(monthNum: number) {
    if (!this.minYear || !this.minMonth || !this.maxYear || !this.maxMonth) return false;

    const y = Number(this.attendanceForm.get('year')?.value);
    if (!y || Number.isNaN(y)) return false;

    // Disable months BEFORE joining date
    if (y < this.minYear) return true;
    if (y === this.minYear) return monthNum < this.minMonth;
    
    // Disable months AFTER max allowed date (future months not allowed)
    if (y > this.maxYear) return true;
    if (y === this.maxYear) return monthNum > this.maxMonth;
    
    return false;
  }

  onClear(){
    this.attendanceForm.reset({
      staff_id: '',
      month: this.maxMonth || new Date().getMonth() + 1,
      year: this.maxYear || new Date().getFullYear(),
      present_days: 0,
      leaves: 0,
      leave_reason: '',
    });
    this.syncSelectedStaff();
    this.enforceJoiningDate();
  }
}
