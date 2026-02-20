import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { PuzzleDefinitionService } from '../../core/services/puzzle-definition.service';
import type { WordLibrary, PuzzleDefinition } from '../../core/database/database.models';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Welkom, {{ username() }}!</h1>

      <div class="quick-actions">
        <mat-card class="action-card" routerLink="/puzzle/new">
          <mat-icon class="action-icon">add_circle</mat-icon>
          <h3>Nieuwe Puzzel</h3>
          <p>Maak een woordzoeker</p>
        </mat-card>

        <mat-card class="action-card" routerLink="/libraries">
          <mat-icon class="action-icon">library_books</mat-icon>
          <h3>Bibliotheken</h3>
          <p>{{ libraryCount() }} bibliotheken</p>
        </mat-card>

        <mat-card class="action-card" routerLink="/puzzle/definitions">
          <mat-icon class="action-icon">view_module</mat-icon>
          <h3>Opgeslagen Puzzels</h3>
          <p>{{ definitionCount() }} puzzeldefinities</p>
        </mat-card>
      </div>

      @if (recentDefinitions().length > 0) {
        <h2>Recente Puzzeldefinities</h2>
        <div class="recent-list">
          @for (def of recentDefinitions(); track def.id) {
            <mat-card class="recent-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>grid_on</mat-icon>
                <mat-card-title>{{ def.name }}</mat-card-title>
                <mat-card-subtitle>{{ def.gridWidth }}×{{ def.gridHeight }} · {{ def.wordCount }} woorden</mat-card-subtitle>
              </mat-card-header>
              <mat-card-actions>
                <a mat-button [routerLink]="['/puzzle/play', def.id]">
                  <mat-icon>play_arrow</mat-icon> Spelen
                </a>
                <a mat-button [routerLink]="['/puzzle/edit', def.id]">
                  <mat-icon>edit</mat-icon> Bewerken
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { font-size: 2rem; margin-bottom: 24px; }
    h2 { font-size: 1.5rem; margin: 32px 0 16px; }
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .action-card {
      cursor: pointer;
      padding: 32px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-4px); }
    }
    .action-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
      margin-bottom: 12px;
    }
    .recent-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .recent-card { padding: 8px; }
  `,
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private libraryService = inject(LibraryService);
  private defService = inject(PuzzleDefinitionService);

  username = signal('');
  libraryCount = signal(0);
  definitionCount = signal(0);
  recentDefinitions = signal<PuzzleDefinition[]>([]);

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    this.username.set(user.username);

    const libs = await this.libraryService.getLibraries(user.id);
    this.libraryCount.set(libs.length);

    const defs = await this.defService.getDefinitions(user.id);
    this.definitionCount.set(defs.length);
    this.recentDefinitions.set(defs.sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 4));
  }
}
