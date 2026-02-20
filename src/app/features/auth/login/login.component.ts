import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { LibraryService } from '../../../core/services/library.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="auth-icon">extension</mat-icon>
          <mat-card-title>Inloggen</mat-card-title>
          <mat-card-subtitle>Welkom terug bij Puzzle Time</mat-card-subtitle>
        </mat-card-header>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <mat-card-content>
          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <form (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Gebruikersnaam</mat-label>
              <input matInput [(ngModel)]="username" name="username"
                     required minlength="3" autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Wachtwoord</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                     [(ngModel)]="password" name="password"
                     required minlength="8" autocomplete="current-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-flat-button class="full-width submit-btn" type="submit"
                    [disabled]="loading()">
              Inloggen
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="auth-link">
            Nog geen account? <a routerLink="/register">Registreren</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      background: var(--mat-sys-surface-container-low);
    }
    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 32px;
    }
    .auth-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
    }
    .full-width { width: 100%; }
    .submit-btn {
      height: 56px;
      font-size: 1.1rem;
      margin-top: 8px;
    }
    .error-message {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .auth-link {
      text-align: center;
      a { color: var(--mat-sys-primary); font-weight: 600; }
    }
    mat-form-field { margin-bottom: 8px; }
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private libraries = inject(LibraryService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);

  async onLogin(): Promise<void> {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.login(this.username, this.password);
    if (result.success) {
      const user = this.auth.currentUser();
      if (user) {
        await this.libraries.seedDefaultLibrary(user.id).catch((e) => console.error('Failed to seed default library', e));
      }
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.error || 'Inloggen mislukt');
    }
    this.loading.set(false);
  }
}
