import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { PlannerItem } from '../../shared/models';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
    <section class="planner-page">
      <section class="hero card">
        <div>
          <p class="eyebrow">AI Planner</p>
          <h2>Suggested day plan</h2>
          <p class="hero-copy">
            Open this page, review the summary, and click <strong>Generate plan</strong> only when you want the assistant to build today’s schedule.
          </p>
          <p class="status-line neutral-text" *ngIf="!hasGenerated && !isLoading">
            Ready to generate a plan for {{ openTaskCount }} open task{{ openTaskCount === 1 ? '' : 's' }}.
          </p>
          <p class="status-line loading-text" *ngIf="isLoading">Generating a fresh plan...</p>
          <p class="status-line success-text" *ngIf="!isLoading && successMessage">{{ successMessage }}</p>
          <p class="status-line error-text" *ngIf="!isLoading && errorMessage">{{ errorMessage }}</p>
        </div>

        <button type="button" (click)="generatePlan()" [disabled]="isLoading || openTaskCount === 0">
          {{ isLoading ? 'Generating...' : (openTaskCount === 0 ? 'No tasks to plan' : 'Generate plan') }}
        </button>
      </section>

      <section class="how-it-works card">
        <h3>How to use this</h3>
        <div class="steps">
          <article class="step">
            <strong>1. Add tasks first</strong>
            <p>Create tasks in the Tasks tab with title, due date, and estimated time.</p>
          </article>
          <article class="step">
            <strong>2. Open Planner</strong>
            <p>The page will wait. It will not generate anything until you click the button.</p>
          </article>
          <article class="step">
            <strong>3. Click Generate plan</strong>
            <p>The assistant will build a day plan from your open tasks, starting with the earliest due items.</p>
          </article>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <div>
            <h3>Today’s plan</h3>
            <p *ngIf="plan.length > 0">These blocks were generated from your current tasks.</p>
            <p *ngIf="plan.length === 0 && !hasGenerated">No plan yet. Click the button when you are ready.</p>
            <p *ngIf="plan.length === 0 && hasGenerated">No schedule blocks were created.</p>
          </div>
        </div>

        <div class="empty" *ngIf="!hasGenerated && !isLoading">
          <strong>Planner is waiting</strong>
          <p>The page is ready. Click <strong>Generate plan</strong> when you want to create today’s schedule.</p>
        </div>

        <div class="empty" *ngIf="!isLoading && hasGenerated && openTaskCount === 0">
          <strong>No open tasks</strong>
          <p>Create tasks first, then come back here and click <strong>Generate plan</strong>.</p>
        </div>

        <div class="loading" *ngIf="isLoading">
          <div class="orbit">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Creating your plan...</p>
        </div>

        <div class="empty" *ngIf="!isLoading && hasGenerated && openTaskCount > 0 && plan.length === 0">
          <strong>No plan returned</strong>
          <p>The planner did not return any schedule blocks for your tasks. Try again after updating task dates.</p>
        </div>

        <div class="plan-list" *ngIf="!isLoading && plan.length > 0">
          <article class="plan-item" *ngFor="let item of plan; trackBy: trackByPlan">
            <div class="time-pill">
              {{ item.startUtc | date:'shortTime' }} - {{ item.endUtc | date:'shortTime' }}
            </div>

            <div class="plan-content">
              <strong>{{ item.title }}</strong>
              <p>{{ item.recommendation }}</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      --panel-text: #0f172a;
      --panel-muted: #64748b;
    }

    .planner-page {
      display: grid;
      gap: 24px;
    }

    .card {
      padding: 24px;
      border-radius: 26px;
      border: 1px solid rgba(27, 26, 23, 0.08);
      background: rgba(255,255,255,0.84);
      box-shadow: 0 18px 44px rgba(37, 50, 78, 0.07);
    }

    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
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
      color: var(--panel-text);
    }

    .hero-copy,
    .section-head p,
    .step p,
    .plan-content p,
    .empty p {
      margin: 10px 0 0;
      color: var(--panel-muted);
      line-height: 1.65;
    }

    .status-line {
      margin: 12px 0 0;
      font-size: 0.93rem;
      font-weight: 600;
    }

    .neutral-text {
      color: #4c4f58;
    }

    .loading-text {
      color: #2457d6;
    }

    .success-text {
      color: #15703a;
    }

    .error-text {
      color: #b42318;
    }

    button {
      padding: 14px 18px;
      border: 0;
      border-radius: 16px;
      background: linear-gradient(135deg, #2457d6, #4f86ff);
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 18px 30px rgba(36, 87, 214, 0.22);
    }

    button:disabled {
      opacity: 0.75;
      cursor: not-allowed;
      box-shadow: none;
    }

    .how-it-works h3,
    .section-head h3 {
      margin: 0;
      font-size: 1.55rem;
      color: var(--panel-text);
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-top: 18px;
    }

    .step {
      padding: 18px;
      border-radius: 18px;
      background: rgba(255,255,255,0.74);
      border: 1px solid rgba(27, 26, 23, 0.08);
    }

    .step strong {
      display: block;
      font-size: 1rem;
      color: var(--panel-text);
    }

    .empty,
    .loading {
      padding: 28px 18px;
      border-radius: 22px;
      text-align: center;
      background: rgba(255,255,255,0.72);
      border: 1px dashed rgba(27, 26, 23, 0.12);
    }

    .empty strong {
      display: block;
      margin-bottom: 8px;
      color: var(--panel-text);
    }

    .loading {
      display: grid;
      justify-items: center;
      gap: 12px;
    }

    .orbit {
      position: relative;
      width: 44px;
      height: 44px;
    }

    .loading span {
      position: absolute;
      inset: 50% auto auto 50%;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #2457d6;
      display: inline-block;
      margin: -5px 0 0 -5px;
      animation: orbit 1.2s infinite ease-in-out;
    }

    .loading span:nth-child(1) {
      transform: translateY(-16px);
    }

    .loading span:nth-child(2) {
      transform: translate(14px, 10px);
      animation-delay: 0.18s;
    }

    .loading span:nth-child(3) {
      transform: translate(-14px, 10px);
      animation-delay: 0.36s;
    }

    .plan-list {
      display: grid;
      gap: 14px;
      margin-top: 18px;
    }

    .plan-item {
      display: grid;
      grid-template-columns: 190px minmax(0, 1fr);
      gap: 16px;
      align-items: start;
      padding: 18px;
      border-radius: 20px;
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(27, 26, 23, 0.08);
    }

    .time-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(36, 87, 214, 0.1);
      color: #2457d6;
      font-weight: 700;
      text-align: center;
    }

    .plan-content strong {
      font-size: 1.05rem;
      color: var(--panel-text);
    }

    @keyframes orbit {
      0%, 80%, 100% {
        opacity: 0.22;
        scale: 1;
      }
      40% {
        opacity: 1;
        scale: 1.25;
      }
    }

    @media (max-width: 1100px) {
      .steps,
      .plan-item {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 700px) {
      .card {
        padding: 18px;
      }

      .hero {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class PlannerComponent {
  private readonly api = inject(ApiService);

  openTaskCount = 0;
  isLoading = false;
  hasGenerated = false;
  successMessage = '';
  errorMessage = '';
  plan: PlannerItem[] = [];

  constructor() {
    this.loadOpenTaskCount();
  }

  generatePlan() {
    if (this.isLoading || this.openTaskCount === 0) {
      if (this.openTaskCount === 0) {
        this.errorMessage = 'There are no open tasks, so no daily plan was generated.';
      }
      return;
    }

    this.isLoading = true;
    this.hasGenerated = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.plan = [];

    this.api.generatePlan().subscribe({
      next: (response) => {
        this.plan = response.data ?? [];
        this.successMessage = response.message || this.buildSuccessMessage(this.plan.length);
        this.isLoading = false;
        this.loadOpenTaskCount();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || error?.error?.title || 'Could not generate the plan. Please try again.';
        this.isLoading = false;
        this.loadOpenTaskCount();
      }
    });
  }

  trackByPlan(_: number, item: PlannerItem) {
    return `${item.title}-${item.startUtc}-${item.endUtc}`;
  }

  private loadOpenTaskCount() {
    this.api.getTasks().subscribe({
      next: (response) => {
        this.openTaskCount = (response.data ?? []).filter((task) => !task.isCompleted).length;
      },
      error: () => {
        this.openTaskCount = 0;
      }
    });
  }

  private buildSuccessMessage(planCount: number) {
    if (planCount === 0) {
      return 'No planner items were returned.';
    }

    return `Plan generated successfully with ${planCount} time block${planCount === 1 ? '' : 's'}.`;
  }
}
