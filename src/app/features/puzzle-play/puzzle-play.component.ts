import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PuzzleDefinitionService } from '../../core/services/puzzle-definition.service';
import { WordService } from '../../core/services/word.service';
import { generatePuzzle } from '../../engine/puzzle-generator';
import type { GeneratedPuzzle } from '../../engine/grid.model';
import { PuzzleGridComponent } from './puzzle-grid/puzzle-grid.component';
import { WordListComponent } from './word-list/word-list.component';
import { CongratulationsComponent } from './congratulations/congratulations.component';

@Component({
  selector: 'app-puzzle-play',
  imports: [
    MatButtonModule, MatIconModule, MatProgressBarModule, MatToolbarModule,
    PuzzleGridComponent, WordListComponent, CongratulationsComponent,
  ],
  template: `
    @switch (gameState()) {
      @case ('loading') {
        <div class="loading-screen">
          <mat-progress-bar mode="indeterminate" />
          <p>Puzzel wordt gegenereerd...</p>
        </div>
      }
      @case ('playing') {
        <div class="play-layout">
          <mat-toolbar class="play-toolbar">
            <span>{{ puzzleName() }}</span>
            <span class="spacer"></span>
            <span class="timer">{{ formattedTime() }}</span>
            <button mat-icon-button (click)="regenerate()">
              <mat-icon>refresh</mat-icon>
            </button>
          </mat-toolbar>

          <div class="game-area">
            <div class="grid-panel">
              @if (puzzle()) {
                <app-puzzle-grid
                  [puzzle]="puzzle()!"
                  [foundWords]="foundWords()"
                  (wordSelected)="onWordSelected($event)" />
              }
            </div>
            <div class="word-panel">
              @if (puzzle()) {
                <app-word-list
                  [words]="puzzle()!.words"
                  [foundWords]="foundWords()" />
              }
            </div>
          </div>
        </div>
      }
      @case ('completed') {
        <app-congratulations
          [wordCount]="puzzle()?.words?.length ?? 0"
          [time]="formattedTime()"
          [puzzleName]="puzzleName()"
          (playAgain)="regenerate()"
          (newPuzzle)="router.navigate(['/puzzle/new'])"
          (goHome)="router.navigate(['/dashboard'])" />
      }
    }
  `,
  styles: `
    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100dvh - var(--navbar-height) - env(safe-area-inset-bottom));
      gap: 24px;
      p { font-size: 1.2rem; }
    }
    .play-layout {
      height: calc(100dvh - var(--navbar-height) - env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
    }
    .play-toolbar {
      flex-shrink: 0;
      .spacer { flex: 1; }
      .timer {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.1rem;
        margin-right: 8px;
      }
    }
    .game-area {
      flex: 1;
      display: flex;
      overflow: hidden;
      padding: 16px;
      gap: 16px;
    }
    .grid-panel {
      flex: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .word-panel {
      flex: 1;
      min-width: 240px;
      max-width: 360px;
      overflow-y: auto;
    }
    @media (max-width: 768px) and (orientation: portrait) {
      .game-area { flex-direction: column; overflow-y: auto; padding: 8px; gap: 8px; }
      .grid-panel { flex: 0 0 auto; height: calc(100vw - 16px); /* 16px = 2 × 8px .game-area padding */ }
      .word-panel { max-width: 100%; min-width: 0; flex: 0 0 auto; overflow-y: auto; }
    }
    @media (max-width: 768px) and (orientation: landscape) {
      .game-area { flex-direction: row; }
      .word-panel { max-width: 50%; min-width: 0; overflow-y: auto; }
    }
  `,
})
export class PuzzlePlayComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private defService = inject(PuzzleDefinitionService);
  private wordService = inject(WordService);

  gameState = signal<'loading' | 'playing' | 'completed'>('loading');
  puzzle = signal<GeneratedPuzzle | null>(null);
  foundWords = signal<Set<string>>(new Set());
  puzzleName = signal('Woordzoeker');

  private timerSeconds = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // Config (from route params or definition)
  private libraryId = 0;
  private gridWidth = 12;
  private gridHeight = 12;
  private wordCount = 8;

  formattedTime = () => {
    const s = this.timerSeconds();
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  async ngOnInit(): Promise<void> {
    const defId = this.route.snapshot.paramMap.get('id');
    const qp = this.route.snapshot.queryParams;

    if (defId) {
      const def = await this.defService.getDefinition(Number(defId));
      if (def) {
        this.puzzleName.set(def.name);
        this.libraryId = def.libraryId;
        this.gridWidth = def.gridWidth;
        this.gridHeight = def.gridHeight;
        this.wordCount = def.wordCount;
      }
    } else if (qp['libraryId']) {
      this.libraryId = Number(qp['libraryId']);
      this.gridWidth = Number(qp['width'] ?? 12);
      this.gridHeight = Number(qp['height'] ?? 12);
      this.wordCount = Number(qp['wordCount'] ?? 8);
      this.puzzleName.set('Snelle Puzzel');
    }

    await this.generate();
  }

  async generate(): Promise<void> {
    this.gameState.set('loading');
    this.foundWords.set(new Set());
    this.timerSeconds.set(0);

    const words = await this.wordService.getRandomWords(this.libraryId, this.wordCount);
    const puzzle = generatePuzzle(this.gridWidth, this.gridHeight, words);
    this.puzzle.set(puzzle);

    this.gameState.set('playing');
    this.startTimer();
  }

  onWordSelected(word: string): void {
    const current = this.foundWords();
    if (current.has(word)) return;

    const updated = new Set(current);
    updated.add(word);
    this.foundWords.set(updated);

    // Check if all words found
    if (this.puzzle() && updated.size >= this.puzzle()!.words.length) {
      this.stopTimer();
      setTimeout(() => this.gameState.set('completed'), 600);
    }
  }

  async regenerate(): Promise<void> {
    this.stopTimer();
    await this.generate();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds.update((t) => t + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
