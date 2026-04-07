import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalaryListComponent } from './components/salary-list/salary-list.component';
import { SalaryComponent } from './components/salary/salary.component';

const routes: Routes = [
  { path: '', component: SalaryListComponent },
  { path: 'salary-add', component: SalaryComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalaryRoutingModule { }
