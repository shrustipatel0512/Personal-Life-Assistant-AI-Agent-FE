import { DOCUMENT, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

type NavItem = {
  label: string;
  route: string;
  description: string;
  exact?: boolean;
  icon: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="isSidebarCollapsed">
      <button class="mobile-scrim" *ngIf="isSidebarOpen" (click)="closeSidebar()" aria-label="Close sidebar"></button>

      <aside class="sidebar" [class.mobile-open]="isSidebarOpen">
        <div class="sidebar-inner">
          <div class="brand-row">
            <div class="brand-mark">
              <span></span>
            </div>

            <div class="brand-copy" *ngIf="!isSidebarCollapsed">
              <p>AI Life OS</p>
              <strong>Personal Life Assistant</strong>
            </div>

            <button
              type="button"
              class="icon-button sidebar-toggle desktop-only"
              (click)="toggleSidebar()"
              [attr.aria-label]="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h10"></path>
              </svg>
            </button>
          </div>

          <div class="sidebar-hero" *ngIf="!isSidebarCollapsed">
            <h1>Plan your day.</h1>
            <p>Tasks, planner, and chat in one place.</p>
          </div>

          <nav class="sidebar-nav">
            <a
              *ngFor="let item of navItems"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="item.exact ? exactMatchOptions : subsetMatchOptions"
              (click)="handleNavClick()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path [attr.d]="item.icon"></path>
                </svg>
              </span>

              <span class="nav-copy" *ngIf="!isSidebarCollapsed">
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
            </a>
          </nav>

          <div class="sidebar-footer" *ngIf="!isSidebarCollapsed">
            <div class="status-orb"></div>
            <div>
              <strong>Assistant online</strong>
            </div>
          </div>
        </div>
      </aside>

      <div class="workspace">
        <header class="topbar">
          <div class="topbar-left">
            <button type="button" class="icon-button mobile-only" (click)="toggleSidebar()" aria-label="Open sidebar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h10"></path>
              </svg>
            </button>

            <div class="page-meta">
              <span class="page-kicker">{{ pageKicker }}</span>
              <h2>{{ pageTitle }}</h2>
              <p>{{ pageDescription }}</p>
            </div>
          </div>

          <div class="topbar-actions">
            <button
              type="button"
              class="theme-toggle"
              (click)="toggleTheme()"
              [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
              <span class="theme-toggle-icon">
                <svg *ngIf="!isDarkMode" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v2.4M12 18.6V21M5.64 5.64l1.7 1.7M16.66 16.66l1.7 1.7M3 12h2.4M18.6 12H21M5.64 18.36l1.7-1.7M16.66 7.34l1.7-1.7M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"></path>
                </svg>
                <svg *ngIf="isDarkMode" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 15.2A7.9 7.9 0 0 1 8.8 4 8.8 8.8 0 1 0 20 15.2Z"></path>
                </svg>
              </span>
              <span class="theme-toggle-copy">
                <strong>{{ isDarkMode ? 'Dark mode' : 'Light mode' }}</strong>
              </span>
            </button>

            <button type="button" class="icon-button notification-btn" aria-label="Notifications">
              <span class="notification-dot"></span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"></path>
              </svg>
            </button>

            <button type="button" class="icon-button" aria-label="Magic actions">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3Zm7 12 1 2.6L23 18l-3 1.4L19 22l-1-2.6L15 18l3-1.4L19 15ZM5 14l.8 2.1L8 17l-2.2.9L5 20l-.8-2.1L2 17l2.2-.9L5 14Z"></path>
              </svg>
            </button>

            <div class="profile-chip">
              <div class="profile-avatar">AI</div>
              <div class="profile-copy">
                <strong>Shruti</strong>
              </div>
            </div>
          </div>
        </header>

        <main class="page-stage">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      min-height: 100vh;
      padding: 20px;
      gap: 18px;
    }

    .sidebar {
      position: sticky;
      top: 20px;
      height: calc(100vh - 40px);
      border-radius: 34px;
      border: 1px solid var(--border);
      background:
        linear-gradient(180deg, var(--shell-panel-top), var(--shell-panel-bottom)),
        radial-gradient(circle at top left, var(--shell-panel-tint), transparent 38%);
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(24px);
      z-index: 12;
      overflow: hidden;
    }

    .sidebar-inner {
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 22px;
      height: 100%;
      padding: 22px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-mark {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background:
        linear-gradient(135deg, rgba(79, 70, 229, 0.92), rgba(59, 130, 246, 0.88)),
        radial-gradient(circle at top, rgba(255,255,255,0.42), transparent 54%);
      box-shadow: 0 22px 38px rgba(79, 70, 229, 0.35);
    }

    .brand-mark span {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: rgba(255,255,255,0.92);
      box-shadow: 0 0 18px rgba(255,255,255,0.7);
    }

    .brand-copy {
      min-width: 0;
    }

    .brand-copy p,
    .brand-copy strong {
      margin: 0;
    }

    .brand-copy p {
      color: var(--muted);
      font-size: 0.74rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .brand-copy strong {
      display: block;
      margin-top: 4px;
      color: var(--text);
      font-size: 1rem;
      font-weight: 700;
    }

    .sidebar-hero {
      padding: 22px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background:
        linear-gradient(160deg, var(--card-strong), var(--card-soft)),
        radial-gradient(circle at top right, rgba(192, 132, 252, 0.18), transparent 38%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .sidebar-hero h1 {
      margin: 0;
      font-size: clamp(1.9rem, 2.2vw, 2.4rem);
      line-height: 1.02;
      letter-spacing: -0.04em;
      color: var(--heading);
    }

    .sidebar-hero p {
      margin: 12px 0 0;
      color: var(--muted);
      line-height: 1.7;
      font-size: 0.95rem;
    }

    .sidebar-nav {
      display: grid;
      gap: 12px;
      align-content: start;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: 20px;
      color: var(--text);
      text-decoration: none;
      border: 1px solid transparent;
      background: var(--nav-bg);
      transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
    }

    .sidebar-nav a:hover {
      transform: translateY(-1px);
      border-color: rgba(99, 102, 241, 0.2);
      background: var(--nav-hover);
      box-shadow: 0 18px 30px rgba(15, 23, 42, 0.2);
    }

    .sidebar-nav a.active {
      border-color: rgba(99, 102, 241, 0.28);
      background:
        linear-gradient(135deg, var(--nav-active), rgba(59, 130, 246, 0.12)),
        var(--nav-bg);
      box-shadow: 0 18px 34px rgba(79, 70, 229, 0.22);
    }

    .nav-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: var(--surface-soft);
      border: 1px solid rgba(148, 163, 184, 0.1);
      flex: 0 0 auto;
    }

    .nav-icon svg,
    .icon-button svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .nav-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .nav-copy strong {
      font-size: 0.98rem;
      font-weight: 700;
    }

    .nav-copy small {
      color: var(--muted);
      font-size: 0.82rem;
    }

    .sidebar-footer {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 20px;
      background: var(--card-soft);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .status-orb {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: var(--success);
      box-shadow: 0 0 16px rgba(34, 197, 94, 0.8);
      margin-top: 6px;
      flex: 0 0 auto;
    }

    .sidebar-footer strong {
      display: block;
      color: var(--heading);
      margin-bottom: 4px;
    }

    .workspace {
      min-width: 0;
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 18px;
      min-height: 0;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 18px 22px;
      border-radius: 30px;
      border: 1px solid var(--border);
      background:
        linear-gradient(135deg, var(--shell-panel-top), var(--shell-panel-bottom)),
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 32%);
      backdrop-filter: blur(22px);
      box-shadow: var(--shadow-md);
    }

    .topbar-left,
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .page-meta {
      min-width: 0;
    }

    .page-kicker {
      display: inline-flex;
      margin-bottom: 6px;
      color: var(--accent);
      font-size: 0.76rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .page-meta h2 {
      margin: 0;
      font-size: clamp(1.3rem, 2vw, 1.8rem);
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: var(--heading);
    }

    .page-meta p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .icon-button {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: var(--surface-soft);
      color: var(--text);
      cursor: pointer;
      transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .icon-button:hover {
      transform: translateY(-1px) scale(1.02);
      background: var(--card-soft);
      border-color: rgba(99, 102, 241, 0.24);
      box-shadow: 0 14px 24px rgba(2, 6, 23, 0.24);
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px 8px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--card-soft);
      color: var(--text);
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .theme-toggle:hover {
      transform: translateY(-1px) scale(1.01);
      border-color: rgba(99, 102, 241, 0.24);
      box-shadow: 0 14px 24px rgba(79, 70, 229, 0.14);
      background: var(--surface-strong);
    }

    .theme-toggle-icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: #ffffff;
      box-shadow: 0 14px 24px rgba(79, 70, 229, 0.22);
      flex: 0 0 auto;
    }

    .theme-toggle-icon svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .theme-toggle-copy {
      text-align: left;
    }

    .theme-toggle-copy strong {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--heading);
    }

    .notification-btn {
      position: relative;
    }

    .notification-dot {
      position: absolute;
      top: 10px;
      right: 11px;
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #fb7185;
      box-shadow: 0 0 12px rgba(251, 113, 133, 0.8);
    }

    .profile-chip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px 8px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: var(--card-soft);
      min-width: 0;
    }

    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      box-shadow: 0 14px 24px rgba(79, 70, 229, 0.28);
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .profile-copy {
      min-width: 0;
    }

    .profile-copy strong {
      color: var(--heading);
      font-size: 0.92rem;
      font-weight: 700;
    }

    .page-stage {
      min-width: 0;
      padding: 6px 2px 20px;
      min-height: 0;
    }

    .mobile-scrim {
      position: fixed;
      inset: 0;
      border: 0;
      background: var(--scrim);
      backdrop-filter: blur(4px);
      z-index: 10;
    }

    .desktop-only {
      display: inline-grid;
    }

    .mobile-only {
      display: none;
    }

    .sidebar-toggle {
      margin-left: auto;
    }

    .sidebar-collapsed {
      grid-template-columns: 112px minmax(0, 1fr);
    }

    .sidebar-collapsed .sidebar-inner {
      grid-template-rows: auto 1fr auto;
    }

    .sidebar-collapsed .brand-row {
      justify-content: center;
    }

    .sidebar-collapsed .sidebar-nav a {
      justify-content: center;
      padding: 12px;
    }

    .sidebar-collapsed .sidebar-footer {
      justify-content: center;
      padding: 14px;
    }

    @media (max-width: 1080px) {
      .app-shell {
        grid-template-columns: 1fr;
        padding: 14px;
      }

      .sidebar {
        position: fixed;
        top: 14px;
        left: 14px;
        bottom: 14px;
        width: min(86vw, 320px);
        height: auto;
        transform: translateX(calc(-100% - 18px));
        transition: transform 0.22s ease;
        overflow: hidden;
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .desktop-only {
        display: none;
      }

      .mobile-only {
        display: inline-grid;
      }
    }

    @media (max-width: 760px) {
      .topbar,
      .topbar-left,
      .topbar-actions {
        flex-wrap: wrap;
      }

      .theme-toggle {
        order: 3;
      }

      .profile-chip {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `]
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly exactMatchOptions = { exact: true };
  readonly subsetMatchOptions = { exact: false };

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/',
      exact: true,
      description: 'Overview',
      icon: 'M3 12.5 12 4l9 8.5M5 10.8V20h5v-5h4v5h5v-9.2'
    },
    {
      label: 'Tasks',
      route: '/tasks',
      description: 'Task list',
      icon: 'M8 7h12M8 12h12M8 17h12M3.8 7.2h.4M3.8 12.2h.4M3.8 17.2h.4'
    },
    {
      label: 'Planner',
      route: '/planner',
      description: 'Daily plan',
      icon: 'M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z'
    },
    {
      label: 'Assistant Chat',
      route: '/chat',
      description: 'AI chat',
      icon: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15H11l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5Z'
    }
  ];

  isSidebarCollapsed = false;
  isSidebarOpen = false;
  isDarkMode = false;

  pageKicker = 'Workspace';
  pageTitle = 'Dashboard';
  pageDescription = 'See your current tasks.';

  constructor() {
    this.restoreTheme();
    this.syncPageMeta(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncPageMeta(event.urlAfterRedirects);
        this.isSidebarOpen = false;
      });
  }

  toggleSidebar() {
    if (this.isMobileViewport()) {
      this.isSidebarOpen = !this.isSidebarOpen;
      return;
    }

    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  handleNavClick() {
    if (this.isMobileViewport()) {
      this.isSidebarOpen = false;
    }
  }

  private isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1080px)').matches;
  }

  private restoreTheme() {
    if (typeof window === 'undefined') {
      return;
    }

    const savedTheme = window.localStorage.getItem('pla-theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDarkMode ? 'dark' : 'light';
    this.document.documentElement.setAttribute('data-theme', theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pla-theme', theme);
    }
  }

  private syncPageMeta(url: string) {
    const cleanUrl = url.split('?')[0];

    if (cleanUrl.startsWith('/chat')) {
      this.pageKicker = 'Conversation';
      this.pageTitle = 'AI Assistant';
      this.pageDescription = 'Ask, plan, and get help.';
      return;
    }

    if (cleanUrl.startsWith('/tasks')) {
      this.pageKicker = 'Execution';
      this.pageTitle = 'Task Studio';
      this.pageDescription = 'Create and update tasks.';
      return;
    }

    if (cleanUrl.startsWith('/planner')) {
      this.pageKicker = 'Planning';
      this.pageTitle = 'Day Planner';
      this.pageDescription = 'Build a simple day plan.';
      return;
    }

    this.pageKicker = 'Overview';
    this.pageTitle = 'Dashboard';
    this.pageDescription = 'See your current tasks.';
  }
}
