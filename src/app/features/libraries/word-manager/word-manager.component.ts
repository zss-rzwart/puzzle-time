import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { WordService } from '../../../core/services/word.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { Word } from '../../../core/database/database.models';

@Component({
  selector: 'app-word-manager',
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatListModule, MatCheckboxModule, MatDividerModule,
  ],
  template: `
    <div class="word-manager">
      <!-- Add word section -->
      <div class="add-section">
        <mat-form-field appearance="outline" class="add-input">
          <mat-label>Woord toevoegen</mat-label>
          <input matInput [(ngModel)]="newWord" (keydown.enter)="addWord()"
                 placeholder="Typ een woord..." />
        </mat-form-field>
        <button mat-flat-button (click)="addWord()" [disabled]="!newWord.trim()">
          <mat-icon>add</mat-icon> Toevoegen
        </button>
      </div>

      <!-- Bulk add section -->
      <details class="bulk-add">
        <summary>Meerdere woorden tegelijk toevoegen</summary>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Woorden (één per regel)</mat-label>
          <textarea matInput [(ngModel)]="bulkWords" rows="5"
                    placeholder="APPEL&#10;BOOM&#10;COMPUTER"></textarea>
        </mat-form-field>
        <button mat-flat-button (click)="addBulkWords()" [disabled]="!bulkWords.trim()">
          <mat-icon>playlist_add</mat-icon> Allemaal toevoegen
        </button>
      </details>

      <mat-divider />

      <!-- Search and filter -->
      <mat-form-field appearance="outline" class="full-width search-field">
        <mat-label>Woorden zoeken</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterWords()" />
      </mat-form-field>

      <!-- Word list -->
      <div class="word-chips">
        @for (word of filteredWords(); track word.id) {
          <mat-chip-row (removed)="removeWord(word)">
            {{ word.word }}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        } @empty {
          <p class="no-words">
            {{ searchQuery ? 'Geen woorden gevonden' : 'Nog geen woorden in deze bibliotheek' }}
          </p>
        }
      </div>
    </div>
  `,
  styles: `
    .word-manager { padding: 16px 0; }
    .add-section {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .add-input { flex: 1; }
    .full-width { width: 100%; }
    .search-field { margin-top: 16px; }
    .bulk-add {
      margin: 16px 0;
      padding: 16px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      summary {
        cursor: pointer;
        font-weight: 500;
        margin-bottom: 12px;
      }
    }
    .word-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .no-words {
      color: var(--mat-sys-on-surface-variant);
      padding: 24px;
      text-align: center;
      width: 100%;
    }
  `,
})
export class WordManagerComponent implements OnInit {
  libraryId = input.required<number>();
  wordCountChanged = output<void>();

  private wordService = inject(WordService);
  private notification = inject(NotificationService);

  allWords = signal<Word[]>([]);
  filteredWords = signal<Word[]>([]);
  newWord = '';
  bulkWords = '';
  searchQuery = '';

  async ngOnInit(): Promise<void> {
    await this.loadWords();
  }

  async loadWords(): Promise<void> {
    const words = await this.wordService.getWords(this.libraryId());
    this.allWords.set(words.sort((a, b) => a.word.localeCompare(b.word)));
    this.filterWords();
    this.wordCountChanged.emit();
  }

  filterWords(): void {
    if (!this.searchQuery) {
      this.filteredWords.set(this.allWords());
    } else {
      const q = this.searchQuery.toUpperCase();
      this.filteredWords.set(this.allWords().filter((w) => w.word.includes(q)));
    }
  }

  async addWord(): Promise<void> {
    if (!this.newWord.trim()) return;
    const result = await this.wordService.addWord(this.libraryId(), this.newWord);
    if (result.success) {
      this.newWord = '';
      await this.loadWords();
      this.notification.success('Woord toegevoegd');
    } else {
      this.notification.error(result.error || 'Fout bij toevoegen');
    }
  }

  async addBulkWords(): Promise<void> {
    const words = this.bulkWords
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    if (words.length === 0) return;

    const result = await this.wordService.addWords(this.libraryId(), words);
    this.bulkWords = '';
    await this.loadWords();
    this.notification.success(`${result.added} woorden toegevoegd, ${result.skipped} overgeslagen`);
  }

  async removeWord(word: Word): Promise<void> {
    await this.wordService.removeWord(word.id!);
    await this.loadWords();
  }
}
