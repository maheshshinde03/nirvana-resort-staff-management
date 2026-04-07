import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StaffService } from '../../../../core/services/staff.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-staff-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.css',
})
export class StaffFormComponent implements OnInit {
  staffForm!: FormGroup;
  isEditMode = false;
  staffId!: number;
  loading = false;

  private notify = inject(NotificationService);

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();

    // ✅ Check Edit Mode
    this.staffId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.staffId) {
      this.isEditMode = true;
      this.getStaffById();
    }
  }

  /**
   * ✅ Initialize Form
   */
  initForm() {
    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      category: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      address: [''],
      joining_date: ['', Validators.required],
      status: ['ACTIVE'],
      leaving_date: [''],
    });

    this.staffForm.get('status')?.valueChanges.subscribe((status) => {
      const normalized = String(status || '').toUpperCase();
      const leaving = this.staffForm.get('leaving_date');
      if (!leaving) return;

      if (normalized === 'INACTIVE') {
        leaving.setValidators([Validators.required]);
      } else {
        leaving.clearValidators();
        leaving.setValue('');
      }
      leaving.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * ✅ Load Staff Data (Edit)
   */
  getStaffById() {
    this.staffService.getStaffById(this.staffId).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.staffForm.patchValue({
          ...data,
          joining_date: data?.joining_date ?? data?.joiningDate,
          leaving_date: data?.leaving_date ?? data?.leavingDate,
        });
      },
    });
  }

  /**
   * ✅ Submit Form
   */
  onSubmit() {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formData: any = { ...this.staffForm.value };
    if (!formData.leaving_date) {
      delete formData.leaving_date;
    }

    if (this.isEditMode) {
      this.staffService.updateStaff(this.staffId, formData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/staff']);
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.staffService.createStaff(formData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/staff']);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  onClear() {
    this.staffForm.reset({
      status: 'ACTIVE',
    });
  }
}
