import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/auth/auth.service';
import { LibraryService } from '../../../core/services/library.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { WordLibrary } from '../../../core/database/database.models';
import { LibraryCreateDialogComponent } from './library-create-dialog.component';

@Component({
  selector: 'app-library-list',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink],
  template: `
    <div class="library-list-page">
      <div class="page-header">
        <div class="header-title">
          <a mat-icon-button routerLink="/dashboard" aria-label="Terug naar dashboard">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1>Woordbibliotheken</h1>
        </div>
      </div>
      <button mat-fab class="fab-add" (click)="openCreateDialog()" aria-label="Nieuwe bibliotheek aanmaken">
        <mat-icon>add</mat-icon>
      </button>

      @if (libraries().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">library_books</mat-icon>
          <h2>Geen bibliotheken gevonden</h2>
          <p>Maak een nieuwe bibliotheek aan om te beginnen.</p>
        </div>
      } @else {
        <div class="library-grid">
          @for (lib of libraries(); track lib.id) {
            <mat-card class="library-card" [routerLink]="['/libraries', lib.id]">
              <mat-card-header>
                <mat-icon mat-card-avatar>{{ lib.isDefault ? 'auto_stories' : 'menu_book' }}</mat-icon>
                <mat-card-title>{{ lib.name }}</mat-card-title>
                <mat-card-subtitle>{{ lib.description }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="lib-stats">
                  <mat-chip-set>
                    <mat-chip>
                      <mat-icon matChipAvatar>text_fields</mat-icon>
                      {{ lib.wordCount }} woorden
                    </mat-chip>
                    @if (lib.isDefault) {
                      <mat-chip highlighted>Standaard</mat-chip>
                    }
                  </mat-chip-set>
                </div>
              </mat-card-content>
              <mat-card-actions>
                @if (!lib.isDefault) {
                  <button mat-button color="warn"
                          (click)="deleteLibrary(lib, $event)">
                    <mat-icon>delete</mat-icon> Verwijderen
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .library-list-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      h1 { font-size: 2rem; margin: 0; }
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .library-card {
      cursor: pointer;
      padding: 16px;
      transition: transform 0.2s;
      &:hover { transform: translateY(-2px); }
    }
    .lib-stats { margin-top: 12px; }
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
export class LibraryListComponent implements OnInit {
  private auth = inject(AuthService);
  private libraryService = inject(LibraryService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  libraries = signal<(WordLibrary & { wordCount: number })[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadLibraries();
  }

  async loadLibraries(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const libs = await this.libraryService.getLibraryWithWordCount(user.id);
    this.libraries.set(libs);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(LibraryCreateDialogComponent, {
      width: '460px',
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const user = this.auth.currentUser();
        if (!user) return;
        await this.libraryService.createLibrary(user.id, result.name, result.description);
        this.notification.success('Bibliotheek aangemaakt!');
        await this.loadLibraries();
      }
    });
  }

  async deleteLibrary(lib: WordLibrary, event: Event): Promise<void> {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Bibliotheek verwijderen',
        message: `Weet je zeker dat je "${lib.name}" wilt verwijderen? Alle woorden worden ook verwijderd.`,
        confirmText: 'Verwijderen',
      },
    });
    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.libraryService.deleteLibrary(lib.id!);
        this.notification.success('Bibliotheek verwijderd');
        await this.loadLibraries();
      }
    });
  }
}
