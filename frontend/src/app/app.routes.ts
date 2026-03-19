import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { PlannerComponent } from './features/planner/planner.component';
import { ChatComponent } from './features/chat/chat.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'chat', component: ChatComponent }
];
