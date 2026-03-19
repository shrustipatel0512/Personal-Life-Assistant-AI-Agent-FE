import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from '../../shared/api.service';
import { TaskItem } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, DatePipe],
  template: `
    <section class="dashboard-page" *ngIf="tasks$ | async as tasks">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Today</p>
          <h2>Know what needs attention right now.</h2>
          <p>
            Your dashboard shows the most important tasks first. Click any priority task to open its full details.
          </p>
        </div>
      </header>

      <section class="panel list-panel">
        <div class="panel-head">
          <div>
            <h3>Priority Tasks</h3>
            <p>Click a task row to open a popup with all task information.</p>
          </div>
        </div>

        <div class="empty" *ngIf="tasks.length === 0">
          <strong>No tasks yet</strong>
          <p>Go to the Tasks tab and create one. It will show here automatically.</p>
        </div>

        <div class="task-list" *ngIf="tasks.length > 0">
          <button
            type="button"
            class="task-row"
            *ngFor="let task of tasks; trackBy: trackByTaskId"
            (click)="openTaskDetails(task)">
            <div class="task-main">
              <strong>{{ task.title }}</strong>
              <p>{{ task.category }} · {{ task.priority }}</p>
            </div>
            <span>{{ task.dueDateUtc ? ('Due ' + (task.dueDateUtc | date:'short')) : 'No due date' }}</span>
          </button>
        </div>
      </section>
    </section>

    <section class="modal-backdrop" *ngIf="selectedTask" (click)="closeTaskDetails()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="panel-head modal-head">
          <div>
            <h3>Task Details</h3>
            <p>Everything about the selected task in one place.</p>
          </div>
          <div class="modal-head-actions">
            <span class="status-chip" [class.done]="selectedTask?.isCompleted">
              {{ selectedTask?.isCompleted ? 'Completed' : 'Open' }}
            </span>
            <button type="button" class="icon-close" (click)="closeTaskDetails()">Close</button>
          </div>
        </div>

        <div class="detail-block">
          <label>Task name</label>
          <h4>{{ selectedTask?.title }}</h4>
        </div>

        <div class="detail-block">
          <label>Description</label>
          <p>{{ selectedTask?.description || 'No description added yet.' }}</p>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <label>Category</label>
            <strong>{{ selectedTask?.category }}</strong>
          </div>
          <div class="detail-card">
            <label>Priority</label>
            <strong>{{ selectedTask?.priority }}</strong>
          </div>
          <div class="detail-card">
            <label>Due date</label>
            <strong>{{ selectedTask?.dueDateUtc ? (selectedTask?.dueDateUtc | date:'medium') : 'Not set' }}</strong>
          </div>
          <div class="detail-card">
            <label>Estimated time</label>
            <strong>{{ selectedTask?.estimatedMinutes }} minutes</strong>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      --panel-text: #0f172a;
      --panel-muted: #64748b;
    }

    .dashboard-page {
      display: grid;
      gap: 24px;
    }

    .hero {
      display: block;
    }

    .eyebrow {
      margin: 0 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #2457d6;
      font-size: 0.76rem;
    }

    h2 {
      margin: 0;
      font-size: clamp(1.9rem, 2.6vw, 2.8rem);
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: #f8fbff;
    }

    .hero-copy p:last-child {
      margin: 12px 0 0;
      color: rgba(226, 232, 240, 0.78);
      line-height: 1.65;
      font-size: 0.98rem;
      max-width: 720px;
    }

    .panel,
    .modal-card {
      background: rgba(255,255,255,0.84);
      border: 1px solid rgba(27, 26, 23, 0.08);
      border-radius: 24px;
      box-shadow: 0 18px 44px rgba(34, 48, 80, 0.06);
    }

    .panel {
      padding: 22px;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }

    .panel-head h3 {
      margin: 0;
      font-size: 1.65rem;
      color: var(--panel-text);
    }

    .panel-head p {
      margin: 8px 0 0;
      color: var(--panel-muted);
      line-height: 1.55;
    }

    .task-list {
      display: grid;
      gap: 12px;
    }

    .task-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid rgba(27, 26, 23, 0.08);
      background: rgba(255,255,255,0.82);
      text-align: left;
      cursor: pointer;
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .task-row:hover {
      transform: translateY(-1px);
      border-color: rgba(36, 87, 214, 0.2);
      box-shadow: 0 14px 30px rgba(36, 87, 214, 0.08);
    }

    .task-main strong {
      display: block;
      font-size: 1.08rem;
      color: var(--panel-text);
    }

    .task-main p {
      margin: 8px 0 0;
      color: var(--panel-muted);
    }

    .task-row span {
      color: #4c4f58;
      font-weight: 600;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      padding: 9px 12px;
      border-radius: 999px;
      background: rgba(27, 26, 23, 0.08);
      color: #4c4f58;
      font-size: 0.84rem;
      font-weight: 700;
    }

    .status-chip.done {
      background: rgba(29, 180, 84, 0.12);
      color: #15703a;
    }

    .detail-block {
      margin-top: 18px;
    }

    .detail-block label,
    .detail-card label {
      display: block;
      margin-bottom: 8px;
      color: #2457d6;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .detail-block h4 {
      margin: 0;
      font-size: 1.45rem;
      line-height: 1.25;
      color: var(--panel-text);
    }

    .detail-block p {
      margin: 0;
      color: var(--panel-muted);
      line-height: 1.7;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 20px;
    }

    .detail-card {
      padding: 16px;
      border-radius: 18px;
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(27, 26, 23, 0.08);
    }

    .empty {
      padding: 28px 18px;
      border-radius: 20px;
      text-align: center;
      background: rgba(255,255,255,0.72);
      border: 1px dashed rgba(27, 26, 23, 0.12);
      color: var(--panel-muted);
    }

    .empty strong {
      display: block;
      margin-bottom: 8px;
      color: var(--panel-text);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.38);
      backdrop-filter: blur(6px);
    }

    .modal-card {
      width: min(100%, 860px);
      max-height: calc(100vh - 48px);
      overflow: auto;
      padding: 24px;
      background: rgba(255,255,255,0.98);
      box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
    }

    .modal-head-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-close {
      padding: 10px 14px;
      border-radius: 14px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(27, 26, 23, 0.08);
      color: var(--panel-text);
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 1100px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 700px) {
      .panel,
      .modal-card {
        padding: 18px;
      }

      .task-row,
      .panel-head,
      .modal-head-actions {
        flex-direction: column;
        align-items: flex-start;
      }

      .modal-backdrop {
        padding: 14px;
      }
    }
  `]
})
export class DashboardComponent {
  private readonly api = inject(ApiService);

  selectedTask: TaskItem | null = null;

  readonly tasks$ = this.api.getTasks().pipe(
    map((response) => response.data ?? []),
    map((tasks) => [...tasks].sort((left, right) => {
      if (left.isCompleted !== right.isCompleted) {
        return Number(left.isCompleted) - Number(right.isCompleted);
      }

      const leftDue = left.dueDateUtc ? new Date(left.dueDateUtc).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueDateUtc ? new Date(right.dueDateUtc).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDue - rightDue;
    }))
  );

  openTaskDetails(task: TaskItem) {
    this.selectedTask = task;
  }

  closeTaskDetails() {
    this.selectedTask = null;
  }

  trackByTaskId(_: number, task: TaskItem) {
    return task.id;
  }

  getOpenTaskCount(tasks: TaskItem[]) {
    return tasks.filter((task) => !task.isCompleted).length;
  }

  getDueSoonCount(tasks: TaskItem[]) {
    const now = Date.now();
    const nextTwoDays = now + (48 * 60 * 60 * 1000);

    return tasks.filter((task) => {
      if (task.isCompleted || !task.dueDateUtc) {
        return false;
      }

      const dueTime = new Date(task.dueDateUtc).getTime();
      return !Number.isNaN(dueTime) && dueTime >= now && dueTime <= nextTwoDays;
    }).length;
  }
}
