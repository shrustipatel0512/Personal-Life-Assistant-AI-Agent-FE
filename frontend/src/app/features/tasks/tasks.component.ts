import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../shared/api.service';
import { TaskItem } from '../../shared/models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, AsyncPipe, DatePipe],
  template: `
    <ng-container *ngIf="tasks$ | async as tasks">
    <section class="tasks-page">
      <header class="page-header">
        <div class="headline">
          <p class="eyebrow">Tasks</p>
          <h2>Create and manage tasks</h2>
          <p class="hero-copy">Add tasks, then edit them from the list.</p>
          <p class="message error page-error" *ngIf="loadErrorMessage">{{ loadErrorMessage }}</p>
        </div>

        <div class="stats">
          <article class="stat-card">
            <strong>{{ tasks.length }}</strong>
            <span>Total tasks</span>
          </article>
          <article class="stat-card">
            <strong>{{ getOpenTaskCount(tasks) }}</strong>
            <span>Open now</span>
          </article>
          <article class="stat-card">
            <strong>{{ getDueSoonCount(tasks) }}</strong>
            <span>Due in 48h</span>
          </article>
        </div>
      </header>

      <section class="grid">
        <form class="card form-card" (ngSubmit)="createTask()">
          <div class="card-head">
            <div>
              <h3>Create Task</h3>
            </div>
          </div>

          <div class="field-group">
            <label for="title">Task title</label>
            <input
              id="title"
              [(ngModel)]="title"
              name="title"
              [disabled]="isSubmitting"
              placeholder="Finish monthly report" />
          </div>

          <div class="field-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="description"
              name="description"
              rows="4"
              [disabled]="isSubmitting"
              placeholder="Add the task details, notes, or goal here."></textarea>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label for="dueDateLocal">Due date and time</label>
              <input
                id="dueDateLocal"
                [(ngModel)]="dueDateLocal"
                name="dueDateLocal"
                type="datetime-local"
                [disabled]="isSubmitting" />
            </div>

            <div class="field-group">
              <label for="estimatedMinutes">Estimated minutes</label>
              <input
                id="estimatedMinutes"
                [(ngModel)]="estimatedMinutes"
                name="estimatedMinutes"
                type="number"
                min="1"
                step="5"
                [disabled]="isSubmitting"
                placeholder="30" />
            </div>
          </div>

          <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
          <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <div class="actions">
            <button type="submit" [disabled]="isSubmitting || !title.trim() || estimatedMinutes < 1">
              {{ isSubmitting ? 'Creating task...' : 'Create task' }}
            </button>
          </div>
        </form>

        <section class="card list-card">
          <div class="card-head">
            <div>
              <h3>Task Board</h3>
              <p>Open a task to edit it.</p>
            </div>
            <button type="button" class="ghost" (click)="refreshTasks()" [disabled]="isSubmitting || isSavingEdit">
              Refresh
            </button>
          </div>

          <div class="empty" *ngIf="tasks.length === 0">
            <strong>No tasks yet</strong>
            <p>Create your first task from the form on the left and it will appear here.</p>
          </div>

          <div class="task-list" *ngIf="tasks.length > 0">
            <article
              class="task"
              *ngFor="let task of tasks; trackBy: trackByTaskId">
              <div class="task-content">
                <div class="task-top">
                  <div class="title-block">
                    <p class="task-kicker">Category: {{ task.category }}</p>
                    <h4>{{ task.title }}</h4>
                  </div>

                  <span class="status-chip" [class.done]="task.isCompleted">
                    {{ task.isCompleted ? 'Completed' : 'Open' }}
                  </span>
                </div>

                <p class="task-description">
                  {{ task.description || 'No description added yet.' }}
                </p>

                <div class="meta-row">
                  <span class="badge category">Category: {{ task.category }}</span>
                  <span class="badge priority">Priority: {{ task.priority }}</span>
                  <span class="badge due" *ngIf="task.dueDateUtc">Due: {{ task.dueDateUtc | date:'medium' }}</span>
                  <span class="badge due muted" *ngIf="!task.dueDateUtc">Due: Not set</span>
                  <span class="badge time">Estimated: {{ task.estimatedMinutes }} minutes</span>
                </div>
              </div>

              <div class="task-actions">
                <button type="button" class="mini-action" (click)="openEditModal(task)">Edit</button>
                <button type="button" class="mini-action danger" (click)="deleteTask(task)">Delete</button>
              </div>
            </article>
          </div>
        </section>
      </section>
    </section>

    <section class="modal-backdrop" *ngIf="editingTask(tasks) as activeTask" (click)="closeEditModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="card-head modal-head">
          <div>
            <h3>Edit Task</h3>
          </div>
          <div class="modal-head-actions">
            <span class="status-chip" [class.done]="editIsCompleted">
              {{ editIsCompleted ? 'Completed' : 'Open' }}
            </span>
            <button type="button" class="icon-close" (click)="closeEditModal()">Close</button>
          </div>
        </div>

        <div class="editor-grid">
          <div class="field-group">
            <label for="editTitle">Task title</label>
            <input
              id="editTitle"
              [(ngModel)]="editTitle"
              name="editTitle"
              [disabled]="isSavingEdit"
              placeholder="Task title" />
          </div>

          <div class="field-group">
            <label for="editCategory">Category</label>
            <select
              id="editCategory"
              [(ngModel)]="editCategory"
              name="editCategory"
              [disabled]="isSavingEdit">
              <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
            </select>
          </div>

          <div class="field-group full-width">
            <label for="editDescription">Description</label>
            <textarea
              id="editDescription"
              [(ngModel)]="editDescription"
              name="editDescription"
              rows="4"
              [disabled]="isSavingEdit"
              placeholder="Describe what this task is about."></textarea>
          </div>

          <div class="field-group">
            <label for="editDueDateLocal">Due date and time</label>
            <input
              id="editDueDateLocal"
              [(ngModel)]="editDueDateLocal"
              name="editDueDateLocal"
              type="datetime-local"
              [disabled]="isSavingEdit" />
          </div>

          <div class="field-group">
            <label for="editEstimatedMinutes">Estimated minutes</label>
            <input
              id="editEstimatedMinutes"
              [(ngModel)]="editEstimatedMinutes"
              name="editEstimatedMinutes"
              type="number"
              min="1"
              step="5"
              [disabled]="isSavingEdit" />
          </div>
        </div>

        <label class="checkbox-row">
          <input
            type="checkbox"
            [(ngModel)]="editIsCompleted"
            name="editIsCompleted"
            [disabled]="isSavingEdit" />
          <span>Mark this task as completed</span>
        </label>

        <p class="message success" *ngIf="editSuccessMessage">{{ editSuccessMessage }}</p>
        <p class="message error" *ngIf="editErrorMessage">{{ editErrorMessage }}</p>

        <div class="editor-actions">
          <button type="button" class="primary" (click)="saveTask(activeTask)" [disabled]="isSavingEdit || !editTitle.trim() || editEstimatedMinutes < 1">
            {{ isSavingEdit ? 'Saving changes...' : 'Save changes' }}
          </button>
          <button type="button" class="ghost" (click)="openEditModal(activeTask)" [disabled]="isSavingEdit">
            Reset
          </button>
          <button type="button" class="ghost" (click)="closeEditModal()" [disabled]="isSavingEdit">
            Cancel
          </button>
          <button type="button" class="danger-button" (click)="deleteTask(activeTask)" [disabled]="isSavingEdit">
            Delete task
          </button>
        </div>
      </div>
    </section>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
      --panel-text: #0f172a;
      --panel-muted: #64748b;
      --panel-soft: #475569;
    }

    .tasks-page {
      display: grid;
      gap: 24px;
    }

    .page-header {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 420px);
      gap: 20px;
      align-items: end;
    }

    .headline {
      max-width: 760px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
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
      font-size: clamp(1.9rem, 2.5vw, 2.7rem);
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: #f8fbff;
    }

    .hero-copy {
      margin: 12px 0 0;
      color: rgba(226, 232, 240, 0.78);
      line-height: 1.65;
      font-size: 0.98rem;
    }

    .stat-card,
    .card {
      border-radius: 26px;
      border: 1px solid rgba(27, 26, 23, 0.08);
      background: rgba(255,255,255,0.84);
      box-shadow: 0 18px 44px rgba(37, 50, 78, 0.07);
    }

    .stat-card {
      padding: 18px;
    }

    .stat-card strong {
      display: block;
      font-size: 1.9rem;
      line-height: 1;
      color: var(--panel-text);
    }

    .stat-card span {
      display: block;
      margin-top: 8px;
      color: var(--panel-muted);
      font-size: 0.9rem;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(360px, 520px) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }

    .card {
      padding: 24px;
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 18px;
      margin-bottom: 18px;
    }

    .card-head h3 {
      margin: 0;
      font-size: 1.65rem;
      color: var(--panel-text);
    }

    .card-head p {
      margin: 8px 0 0;
      color: var(--panel-muted);
      line-height: 1.55;
    }

    .field-group {
      display: grid;
      gap: 8px;
      margin-top: 16px;
    }

    .field-row,
    .editor-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.93rem;
      font-weight: 700;
      color: #31343d;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(27, 26, 23, 0.08);
      background: rgba(255,255,255,0.95);
      color: var(--panel-text);
      font: inherit;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: rgba(36, 87, 214, 0.34);
      box-shadow: 0 0 0 4px rgba(36, 87, 214, 0.1);
    }

    textarea {
      resize: vertical;
      min-height: 110px;
    }

    .message {
      margin: 16px 0 0;
      padding: 12px 14px;
      border-radius: 14px;
      font-weight: 600;
    }

    .message.success {
      background: rgba(29, 180, 84, 0.1);
      color: #15703a;
      border: 1px solid rgba(29, 180, 84, 0.18);
    }

    .message.error {
      background: rgba(220, 38, 38, 0.08);
      color: #b42318;
      border: 1px solid rgba(220, 38, 38, 0.16);
    }

    .actions,
    .editor-actions {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    button {
      border: 0;
      cursor: pointer;
      font: inherit;
    }

    .primary,
    button[type="submit"] {
      padding: 14px 18px;
      border-radius: 16px;
      background: linear-gradient(135deg, #2457d6, #4f86ff);
      color: #fff;
      font-weight: 700;
      box-shadow: 0 18px 30px rgba(36, 87, 214, 0.22);
    }

    button[type="submit"] {
      width: 100%;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      box-shadow: none;
    }

    .ghost,
    .mini-action,
    .danger-button {
      padding: 11px 14px;
      border-radius: 14px;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(27, 26, 23, 0.08);
      color: var(--panel-text);
      font-weight: 600;
    }

    .danger-button,
    .mini-action.danger {
      background: rgba(220, 38, 38, 0.08);
      color: #b42318;
      border-color: rgba(220, 38, 38, 0.16);
    }

    .task-list {
      display: grid;
      gap: 14px;
    }

    .task {
      padding: 16px;
      border-radius: 22px;
      border: 1px solid rgba(27, 26, 23, 0.08);
      background: rgba(255,255,255,0.8);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
    }

    .task-content {
      display: block;
      width: 100%;
    }

    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .task-kicker {
      margin: 0 0 8px;
      color: #2457d6;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .task h4 {
      margin: 0;
      font-size: 1.14rem;
      line-height: 1.3;
      color: var(--panel-text);
    }

    .task-description {
      margin: 14px 0 0;
      color: var(--panel-muted);
      line-height: 1.65;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }

    .badge,
    .status-chip {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.84rem;
      font-weight: 700;
    }

    .badge.category {
      background: rgba(36, 87, 214, 0.1);
      color: #2457d6;
    }

    .badge.priority {
      background: rgba(249, 115, 22, 0.12);
      color: #b45309;
    }

    .badge.due {
      background: rgba(27, 26, 23, 0.06);
      color: #4c4f58;
    }

    .badge.time {
      background: rgba(91, 33, 182, 0.1);
      color: #5b21b6;
    }

    .badge.muted {
      color: var(--panel-muted);
    }

    .status-chip {
      background: rgba(27, 26, 23, 0.08);
      color: #4c4f58;
    }

    .status-chip.done {
      background: rgba(29, 180, 84, 0.12);
      color: #15703a;
    }

    .task-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
    }

    .checkbox-row {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 18px;
      font-weight: 600;
    }

    .checkbox-row input {
      width: auto;
      padding: 0;
      margin: 0;
    }

    .empty {
      padding: 32px 18px;
      border-radius: 22px;
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
      width: min(100%, 900px);
      max-height: calc(100vh - 48px);
      overflow: auto;
      padding: 24px;
      border-radius: 28px;
      border: 1px solid rgba(27, 26, 23, 0.08);
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
      color: var(--text);
      color: var(--panel-text);
      font-weight: 600;
    }

    @media (max-width: 1280px) {
      .page-header,
      .grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1100px) {
      .page-header,
      .stats,
      .grid,
      .field-row,
      .editor-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 700px) {
      .card,
      .stat-card {
        padding: 18px;
      }

      h2 {
        font-size: 1.65rem;
      }

      .grid {
        gap: 18px;
      }

      .card-head,
      .task-top,
      .task-actions,
      .editor-actions,
      .modal-head-actions {
        flex-direction: column;
        align-items: flex-start;
      }

      .meta-row {
        gap: 8px;
      }

      .modal-backdrop {
        padding: 14px;
      }

      .modal-card {
        padding: 18px;
        border-radius: 22px;
      }
    }
  `]
})
export class TasksComponent {
  private readonly api = inject(ApiService);
  private readonly refreshTasks$ = new Subject<void>();

  readonly categories = ['Work', 'Personal', 'Health', 'Finance', 'Family'];

  title = '';
  description = '';
  dueDateLocal = '';
  estimatedMinutes = 30;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  editingTaskId = '';
  editTitle = '';
  editDescription = '';
  editCategory = 'Personal';
  editDueDateLocal = '';
  editEstimatedMinutes = 30;
  editIsCompleted = false;
  isSavingEdit = false;
  editSuccessMessage = '';
  editErrorMessage = '';
  loadErrorMessage = '';

  readonly tasks$ = this.refreshTasks$.pipe(
    startWith(void 0),
    switchMap(() => this.api.getTasks().pipe(
      map((response) => {
        this.loadErrorMessage = '';
        return response.data ?? [];
      }),
      catchError((error) => {
        const message = error?.error?.message || error?.error?.title || 'Could not load tasks from the API. You can still create a task and try refresh again.';
        this.loadErrorMessage = message;
        return of([] as TaskItem[]);
      })
    ))
  );

  createTask() {
    if (!this.title.trim() || this.estimatedMinutes < 1 || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api.createTask({
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      dueDateUtc: this.toUtcIsoString(this.dueDateLocal),
      estimatedMinutes: this.estimatedMinutes
    }).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Task created successfully.';
        this.title = '';
        this.description = '';
        this.dueDateLocal = '';
        this.estimatedMinutes = 30;
        this.isSubmitting = false;

        this.refreshTasks$.next();
      },
      error: (error) => {
        const message = error?.error?.message || error?.error?.title || 'Task creation failed. Please check the API and try again.';
        this.errorMessage = message;
        this.isSubmitting = false;
      }
    });
  }

  refreshTasks() {
    this.refreshTasks$.next();
  }

  openEditModal(task: TaskItem) {
    this.editingTaskId = task.id;
    this.editTitle = task.title;
    this.editDescription = task.description ?? '';
    this.editCategory = task.category || this.categories[0];
    this.editDueDateLocal = this.toLocalDateTime(task.dueDateUtc);
    this.editEstimatedMinutes = task.estimatedMinutes || 30;
    this.editIsCompleted = task.isCompleted;
    this.editSuccessMessage = '';
    this.editErrorMessage = '';
  }

  closeEditModal() {
    this.editingTaskId = '';
    this.editSuccessMessage = '';
    this.editErrorMessage = '';
  }

  editingTask(tasks: TaskItem[]) {
    return tasks.find((task) => task.id === this.editingTaskId) ?? null;
  }

  saveTask(task: TaskItem) {
    if (!this.editTitle.trim() || this.editEstimatedMinutes < 1 || this.isSavingEdit) {
      return;
    }

    this.isSavingEdit = true;
    this.editSuccessMessage = '';
    this.editErrorMessage = '';

    this.api.updateTask(task.id, {
      title: this.editTitle.trim(),
      description: this.editDescription.trim() || undefined,
      category: this.editCategory,
      dueDateUtc: this.toUtcIsoString(this.editDueDateLocal),
      estimatedMinutes: this.editEstimatedMinutes,
      isCompleted: this.editIsCompleted
    }).subscribe({
      next: (response) => {
        this.editSuccessMessage = response.message || 'Task updated successfully.';
        this.isSavingEdit = false;
        this.closeEditModal();
        this.refreshTasks$.next();
      },
      error: (error) => {
        const message = error?.error?.message || error?.error?.title || 'Task update failed. Please try again.';
        this.editErrorMessage = message;
        this.isSavingEdit = false;
      }
    });
  }

  deleteTask(task: TaskItem) {
    if (this.isSavingEdit || this.isSubmitting) {
      return;
    }

    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    this.api.deleteTask(task.id).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Task deleted successfully.';
        this.editSuccessMessage = '';
        this.editErrorMessage = '';
        if (this.editingTaskId === task.id) {
          this.closeEditModal();
        }
        this.refreshTasks$.next();
      },
      error: (error) => {
        const message = error?.error?.message || error?.error?.title || 'Task delete failed. Please try again.';
        this.editErrorMessage = message;
      }
    });
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

  private toUtcIsoString(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private toLocalDateTime(value?: string) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const localValue = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localValue.toISOString().slice(0, 16);
  }
}
