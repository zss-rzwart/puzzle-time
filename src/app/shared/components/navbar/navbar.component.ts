import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  template: `
    <mat-toolbar class="navbar">
      <button mat-icon-button routerLink="/dashboard">
        <mat-icon>extension</mat-icon>
      </button>
      <span class="brand" routerLink="/dashboard">Puzzle Time</span>

      <span class="spacer"></span>

      @if (isAuthenticated()) {
        <nav class="nav-links desktop-nav">
          <a mat-button routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a mat-button routerLink="/libraries" routerLinkActive="active">
            <mat-icon>library_books</mat-icon> Bibliotheken
          </a>
          <a mat-button routerLink="/puzzle/definitions" routerLinkActive="active">
            <mat-icon>view_module</mat-icon> Puzzels
          </a>
        </nav>

        <button mat-icon-button class="hamburger-btn" [matMenuTriggerFor]="mobileMenu" aria-label="Menu">
          <mat-icon>menu</mat-icon>
        </button>
        <mat-menu #mobileMenu="matMenu">
          <a mat-menu-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a mat-menu-item routerLink="/libraries">
            <mat-icon>library_books</mat-icon> Bibliotheken
          </a>
          <a mat-menu-item routerLink="/puzzle/definitions">
            <mat-icon>view_module</mat-icon> Puzzels
          </a>
        </mat-menu>

        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-header">{{ username() }}</div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Uitloggen
          </button>
        </mat-menu>
      }
    </mat-toolbar>
  `,
  styles: `
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
      color: var(--mat-sys-on-primary);
      --mat-icon-button-state-layer-color: var(--mat-sys-on-primary);
      --mat-text-button-state-layer-color: var(--mat-sys-on-primary);
    }
    .brand {
      font-size: 1.3rem;
      font-weight: 700;
      cursor: pointer;
      margin-left: 8px;
      color: var(--mat-sys-on-primary);
      letter-spacing: 0.5px;
    }
    .spacer { flex: 1; }
    .nav-links {
      display: flex;
      gap: 4px;
      a { color: var(--mat-sys-on-primary); }
      a.active { opacity: 1; }
      a:not(.active) { opacity: 0.8; }
    }
    .hamburger-btn { display: none; }
    @media (max-width: 768px) {
      .desktop-nav { display: none; }
      .hamburger-btn { display: inline-flex; }
    }
    .menu-header {
      padding: 8px 16px;
      font-weight: 600;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      margin-bottom: 4px;
    }
  `,
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isAuthenticated = this.auth.isAuthenticated;
  username = computed(() => this.auth.currentUser()?.username ?? '');

  logout(): void {
    this.auth.logout();
  }
}
