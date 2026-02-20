import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/auth/auth.service';
import { PuzzleDefinitionService } from '../../../core/services/puzzle-definition.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { PuzzleDefinition } from '../../../core/database/database.models';

@Component({
  selector: 'app-puzzle-definition-list',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="def-list-page">
      <div class="page-header">
        <h1>Opgeslagen Puzzels</h1>
        <a mat-fab extended routerLink="/puzzle/new">
          <mat-icon>add</mat-icon> Nieuwe Puzzel
        </a>
      </div>

      @if (definitions().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">view_module</mat-icon>
          <h2>Geen puzzeldefinities</h2>
          <p>Maak een nieuwe puzzel aan om te beginnen.</p>
          <a mat-flat-button routerLink="/puzzle/new">
            <mat-icon>add</mat-icon> Eerste Puzzel Maken
          </a>
        </div>
      } @else {
        <div class="def-grid">
          @for (def of definitions(); track def.id) {
            <mat-card class="def-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>grid_on</mat-icon>
                <mat-card-title>{{ def.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ def.gridWidth }}×{{ def.gridHeight }} raster · {{ def.wordCount }} woorden
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-actions>
                <a mat-button [routerLink]="['/puzzle/play', def.id]">
                  <mat-icon>play_arrow</mat-icon> Spelen
                </a>
                <a mat-button [routerLink]="['/puzzle/edit', def.id]">
                  <mat-icon>edit</mat-icon> Bewerken
                </a>
                <button mat-button (click)="duplicate(def)">
                  <mat-icon>content_copy</mat-icon> Kopiëren
                </button>
                <button mat-button color="warn" (click)="delete(def)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .def-list-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      h1 { font-size: 2rem; margin: 0; }
    }
    .def-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .def-card { padding: 8px; }
    .empty-state {
      text-align: center;
      padding: 64px 24px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-outline);
    }
  `,
})
export class PuzzleDefinitionListComponent implements OnInit {
  private auth = inject(AuthService);
  private defService = inject(PuzzleDefinitionService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  definitions = signal<PuzzleDefinition[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const defs = await this.defService.getDefinitions(user.id);
    this.definitions.set(defs.sort((a, b) => +b.updatedAt - +a.updatedAt));
  }

  async duplicate(def: PuzzleDefinition): Promise<void> {
    await this.defService.duplicateDefinition(def.id!);
    this.notification.success('Puzzeldefinitie gekopieerd');
    await this.load();
  }

  async delete(def: PuzzleDefinition): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Puzzeldefinitie verwijderen',
        message: `Weet je zeker dat je "${def.name}" wilt verwijderen?`,
        confirmText: 'Verwijderen',
      },
    });
    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.defService.deleteDefinition(def.id!);
        this.notification.success('Puzzeldefinitie verwijderd');
        await this.load();
      }
    });
  }
}
