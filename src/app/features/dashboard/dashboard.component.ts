import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { PuzzleDefinitionService } from '../../core/services/puzzle-definition.service';
import type { PuzzleDefinition } from '../../core/database/database.models';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="quick-actions">
        <mat-card class="action-card" routerLink="/puzzle/new">
          <mat-icon class="action-icon">add_circle</mat-icon>
          <span class="action-label">Nieuwe Puzzel</span>
        </mat-card>

        <mat-card class="action-card" routerLink="/libraries">
          <mat-icon class="action-icon">library_books</mat-icon>
          <span class="action-label">Bibliotheken</span>
        </mat-card>

        <mat-card class="action-card" routerLink="/puzzle/definitions">
          <mat-icon class="action-icon">view_module</mat-icon>
          <span class="action-label">Opgeslagen Puzzels</span>
        </mat-card>
      </div>

      @if (recentDefinitions().length > 0) {
        <div class="recent-section">
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
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .dashboard {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    h2 { font-size: 1.5rem; margin: 16px 0 12px; }
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      flex-shrink: 0;
    }
    .action-card {
      cursor: pointer;
      padding: 32px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      &:hover { transform: translateY(-4px); }
    }
    .action-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
      margin-bottom: 8px;
    }
    .action-label {
      font-size: 1rem;
      font-weight: 500;
    }
    .recent-section {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .recent-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .recent-card { padding: 8px; }

    @media (max-width: 768px) {
      .dashboard {
        padding: 8px;
      }
      .quick-actions {
        gap: 4px;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      }
      .action-card {
        padding: 8px;
      }
      .action-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 4px;
      }
      .action-label {
        font-size: 0.75rem;
      }
      .recent-list {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private defService = inject(PuzzleDefinitionService);

  recentDefinitions = signal<PuzzleDefinition[]>([]);

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const defs = await this.defService.getDefinitions(user.id);
    this.recentDefinitions.set(defs.sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 4));
  }
}
