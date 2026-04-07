import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  mobileNavOpen = false;
  sidebarCollapsed = false;
  darkMode = false;
  private destroyRef = inject(DestroyRef);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.sidebarCollapsed = localStorage.getItem('ui.sidebarCollapsed') === '1';
    this.darkMode = localStorage.getItem('ui.theme') === 'dark';
    this.applyTheme();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.mobileNavOpen = false;
      });
  }

  openMobileNav() {
    this.mobileNavOpen = true;
  }

  closeMobileNav() {
    this.mobileNavOpen = false;
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('ui.sidebarCollapsed', this.sidebarCollapsed ? '1' : '0');
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('ui.theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['theme'] = this.darkMode ? 'dark' : 'light';
  }

}
