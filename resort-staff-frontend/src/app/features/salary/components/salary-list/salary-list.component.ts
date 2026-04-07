import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalaryService } from '../../../../core/services/salary.service';
import { StaffService } from '../../../../core/services/staff.service';

@Component({
  selector: 'app-salary-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salary-list.component.html',
  styleUrl: './salary-list.component.css'
})
export class SalaryListComponent implements OnInit {
  loading = false;
  errorMsg = '';
  filterForm!: FormGroup;

  salaryList: any[] = [];
  staffList: any[] = [];

  page = 1;
  totalPages = 1;
  pages: number[] = [];

  constructor(
    private fb: FormBuilder,
    private salaryService: SalaryService,
    private staffService: StaffService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      month: [''],
      year: [new Date().getFullYear()]
    });
  }

  ngOnInit(): void {
    this.loadStaffList();
    this.getSalaryList();
  }

  /**
   * Load Staff List for Autocomplete
   */
  loadStaffList() {
    this.staffService.getStaff({ limit: 1000 }).subscribe({
      next: (res: any) => {
        // Handle different response structures
        let staffData = res?.data || [];
        
        // Check if staffData is an object with nested data (paginated response)
        if (staffData && typeof staffData === 'object' && !Array.isArray(staffData)) {
          // Try to extract array from nested structure
          if (Array.isArray(staffData.data)) {
            staffData = staffData.data;
          } else if (Array.isArray(staffData.records)) {
            staffData = staffData.records;
          } else {
            staffData = [];
          }
        }
        
        // Ensure it's always an array
        this.staffList = Array.isArray(staffData) ? staffData : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.staffList = [];
      }
    });
  }

  /**
   * Get Salary List from Database
   */
  getSalaryList() {
    this.loading = true;
    this.errorMsg = '';
    this.salaryList = []; // Reset to empty array

    const filters = {
      search: this.filterForm.get('search')?.value || '',
      month: this.filterForm.get('month')?.value || '',
      year: this.filterForm.get('year')?.value || ''
    };

    this.salaryService.getSalaryList(filters).subscribe({
      next: (res: any) => {
        // Safely extract data
        let data = res?.data;
        
        // Ensure data is always an array
        if (!Array.isArray(data)) {
          data = [];
        }
        
        // Assign to component property
        this.salaryList = [...data]; // Use spread operator to ensure it's a new array
        
        this.calculatePages();

        if (this.salaryList.length === 0) {
          this.errorMsg = 'No salary records found';
        }

        this.loading = false;
        
        // Force change detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.message || err?.message || err?.toString() || 'Failed to load salary records';
        this.salaryList = [];
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      complete: () => {
      }
    });
  }

  /**
   * Apply Filters
   */
  applyFilters() {
    this.page = 1;
    this.getSalaryList();
  }

  /**
   * Reset Filters
   */
  resetFilters() {
    this.filterForm.reset({
      search: '',
      month: '',
      year: new Date().getFullYear()
    });
    this.page = 1;
    this.getSalaryList();
  }

  /**
   * Change Page
   */
  changePage(pageNum: number) {
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.page = pageNum;
    }
  }

  /**
   * Calculate Pages for Pagination
   */
  private calculatePages() {
    try {
      const itemsPerPage = 10;
      const totalItems = this.salaryList?.length || 0;
      this.totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

      this.pages = [];
      for (let i = 1; i <= this.totalPages; i++) {
        this.pages.push(i);
      }
    } catch (e) {
      this.totalPages = 1;
      this.pages = [1];
    }
  }

  /**
   * Get Paginated Salary List
   */
  get attendanceList(): any[] {
    try {
      // Safety check - ensure salaryList is always an array
      if (!Array.isArray(this.salaryList)) {
        return [];
      }

      if (this.salaryList.length === 0) {
        return [];
      }

      const itemsPerPage = 10;
      const startIndex = (this.page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const result = this.salaryList.slice(startIndex, endIndex);
      return Array.isArray(result) ? result : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Calculate Salary Display (for backward compatibility)
   */
  calculateSalary(salary: any): number {
    return salary?.total_salary || 0;
  }

  /**
   * TrackBy function for ngFor performance
   */
  trackBySalaryId(index: number, salary: any): any {
    return salary?.id || index;
  }

  /**
   * Print Salary Slip
   * Navigates to salary component which has the print template
   */
  printSlip(salary: any) {
    console.log('🖨️ printSlip called with salary:', salary);
    
    if (!salary || !salary.staff_id) {
      console.error('❌ Invalid salary record:', salary);
      alert('Invalid salary record');
      return;
    }

    // Convert month name to month number if needed
    let monthNumber = salary.month;
    if (typeof monthNumber === 'string') {
      const monthMap: { [key: string]: number } = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      monthNumber = monthMap[monthNumber] || 1;
    }

    console.log('📍 Navigating to /salary with params:', {
      staffId: salary.staff_id,
      month: monthNumber,
      year: salary.year,
      presentDays: salary.present_days,
      leaveDays: salary.leave_days
    });

    // Navigate to salary component with query parameters
    this.router.navigate(['/salary'], {
      queryParams: {
        staffId: salary.staff_id,
        month: monthNumber,
        year: salary.year,
        presentDays: salary.present_days,
        leaveDays: salary.leave_days,
        print: 'true'
      }
    });
  }

}
