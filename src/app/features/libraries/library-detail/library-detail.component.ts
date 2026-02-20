import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { LibraryService } from '../../../core/services/library.service';
import { WordService } from '../../../core/services/word.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { WordLibrary } from '../../../core/database/database.models';
import { WordManagerComponent } from '../word-manager/word-manager.component';

@Component({
  selector: 'app-library-detail',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink, WordManagerComponent],
  template: `
    <div class="library-detail">
      <div class="page-header">
        <a mat-icon-button routerLink="/libraries">
          <mat-icon>arrow_back</mat-icon>
        </a>
        @if (library()) {
          <div class="header-info">
            <h1>{{ library()!.name }}</h1>
            <p>{{ library()!.description }}</p>
          </div>
          <mat-chip-set>
            <mat-chip>{{ wordCount() }} woorden</mat-chip>
            @if (library()!.isDefault) {
              <mat-chip highlighted>Standaard</mat-chip>
            }
          </mat-chip-set>
        }
      </div>

      @if (library()) {
        <app-word-manager
          [libraryId]="library()!.id!"
          (wordCountChanged)="loadWordCount()" />
      }
    </div>
  `,
  styles: `
    .library-detail {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
    }
    .header-info {
      flex: 1;
      h1 { font-size: 1.8rem; margin: 0; }
      p { color: var(--mat-sys-on-surface-variant); margin: 4px 0 0; }
    }
  `,
})
export class LibraryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private libraryService = inject(LibraryService);
  private wordService = inject(WordService);

  library = signal<WordLibrary | null>(null);
  wordCount = signal(0);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const lib = await this.libraryService.getLibrary(id);
    if (lib) {
      this.library.set(lib);
      await this.loadWordCount();
    }
  }

  async loadWordCount(): Promise<void> {
    const lib = this.library();
    if (lib) {
      this.wordCount.set(await this.wordService.getWordCount(lib.id!));
    }
  }
}
