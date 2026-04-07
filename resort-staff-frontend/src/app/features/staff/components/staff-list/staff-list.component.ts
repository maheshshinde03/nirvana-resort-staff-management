import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, finalize, switchMap } from 'rxjs/operators';
import { StaffService } from '../../../../core/services/staff.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryLabelPipe } from '../../../../shared/pipes/category-label.pipe';

@Component({
  selector: 'app-staff-list',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink, CategoryLabelPipe],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.css',
})
export class StaffListComponent implements OnInit {
  staff: any[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 0;

  form!: FormGroup;
  loading = false;
  deletingId: number | null = null;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.listenFilters();
    this.loadStaff();
  }

  initForm() {
    this.form = this.fb.group({
      search: [''],
      role: [''],
      category: [''],
      status: [''],
    });
  }

  listenFilters() {
    this.form.valueChanges
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.page = 1;
          return this.fetchStaff();
        }),
      )
      .subscribe((res) => {
        this.applyStaffResponse(res);
      });
  }

  fetchStaff() {
    this.errorMsg = '';
    this.loading = true;

    const filters = {
      ...this.form.value,
      page: this.page,
      limit: this.limit,
    };

    return this.staffService.getStaff(filters).pipe(
      finalize(() => {
        this.loading = false;
      }),
    );
  }

  loadStaff() {
    this.fetchStaff().subscribe((res) => {
      this.applyStaffResponse(res);
    });
  }

  changePage(page: number) {
    this.page = page;
    this.loadStaff();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, idx) => idx + 1);
  }

  private applyStaffResponse(res: any) {
    const payload = res?.data ?? res;
    const list = payload?.data;

    this.staff = Array.isArray(list) ? list : [];
    this.total = Number(payload?.total ?? this.staff.length ?? 0);
    this.totalPages = Number(payload?.totalPages ?? Math.ceil(this.total / this.limit) ?? 0);
  }

  onDelete(staff: any) {
    const id = Number(staff?.id);
    if (!id || Number.isNaN(id)) return;

    const name = staff?.name ? ` "${staff.name}"` : '';
    const ok = window.confirm(`Delete staff${name}?`);
    if (!ok) return;

    this.errorMsg = '';
    this.deletingId = id;

    this.staffService
      .deleteStaff(id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
        }),
      )
      .subscribe({
        next: () => {
          if (this.staff.length <= 1 && this.page > 1) {
            this.page -= 1;
          }
          this.loadStaff();
        },
        error: (err: any) => {
          this.errorMsg = err?.error?.message || 'Delete failed';
        },
      });
  }

  resetFilters() {
    this.form.reset();
    this.page = 1;
    this.initForm();
    this.listenFilters();
    this.loadStaff();
  }
}
