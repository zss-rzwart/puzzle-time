import {
  Component, input, output, signal, computed, ElementRef,
  viewChild, AfterViewInit, OnDestroy,
} from '@angular/core';
import type { GeneratedPuzzle, CellPosition, PlacedWord } from '../../../engine/grid.model';
import { Direction, DIRECTION_VECTORS } from '../../../engine/direction.model';

const WORD_COLORS = [
  '#EF5350', '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC',
  '#26C6DA', '#EC407A', '#8D6E63', '#78909C', '#D4E157',
];

@Component({
  selector: 'app-puzzle-grid',
  template: `
    <div class="grid-wrapper" #gridWrapper>
      <div class="grid"
           [style.grid-template-columns]="'repeat(' + puzzle().grid.width + ', 1fr)'"
           [style.font-size.px]="cellFontSize()"
           (pointerdown)="onPointerDown($event)"
           (pointermove)="onPointerMove($event)"
           (pointerup)="onPointerUp($event)"
           (pointerleave)="onPointerUp($event)">
        @for (row of puzzle().grid.cells; track $index; let r = $index) {
          @for (cell of row; track $index; let c = $index) {
            <div class="cell"
                 [attr.data-row]="r"
                 [attr.data-col]="c"
                 [class.selecting]="isSelecting(r, c)"
                 [class.found]="isFound(r, c)"
                 [style.--found-color]="getFoundColor(r, c)">
              <span class="letter">{{ cell.letter }}</span>
              @for (highlight of getHighlights(r, c); track $index) {
                <div class="found-overlay" [style.background]="highlight"></div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
    .grid-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .grid {
      display: grid;
      gap: 2px;
      background: var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;
      max-width: min(100%, 90vh);
      max-height: min(100%, 90vh);
      width: 100%;
      aspect-ratio: 1;
      border: 1px solid black;
      padding: 8px;
      margin: 16px;
      box-sizing: border-box;
    }
    .cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface);
      aspect-ratio: 1;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .cell.selecting {
      background: var(--mat-sys-primary-container);
      .letter { color: var(--mat-sys-on-primary-container); font-weight: 700; }
    }
    .cell.found {
      background: color-mix(in srgb, var(--found-color, #66BB6A) 25%, var(--mat-sys-surface));
    }
    .letter {
      position: relative;
      z-index: 2;
      font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
      font-weight: 600;
      line-height: 1;
    }
    .found-overlay {
      position: absolute;
      inset: 0;
      opacity: 0.2;
      z-index: 1;
      border-radius: 4px;
    }
  `,
})
export class PuzzleGridComponent implements AfterViewInit {
  puzzle = input.required<GeneratedPuzzle>();
  foundWords = input.required<Set<string>>();
  wordSelected = output<string>();

  private gridWrapper = viewChild<ElementRef<HTMLElement>>('gridWrapper');

  private selecting = false;
  private startCell: CellPosition | null = null;
  private lockedDirection: { dx: number; dy: number } | null = null;
  currentSelection = signal<CellPosition[]>([]);
  cellFontSize = signal(16);

  private foundColorMap = new Map<string, string>();

  ngAfterViewInit(): void {
    this.calculateFontSize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.calculateFontSize());
    }
  }

  private calculateFontSize(): void {
    const wrapper = this.gridWrapper()?.nativeElement;
    if (!wrapper) return;
    const availableWidth = wrapper.clientWidth;
    const gridSize = Math.max(this.puzzle().grid.width, this.puzzle().grid.height);
    const cellSize = (availableWidth * 0.9) / gridSize;
    this.cellFontSize.set(Math.max(12, Math.min(32, cellSize * 0.55)));
  }

  onPointerDown(event: PointerEvent): void {
    const cell = this.getCellFromEvent(event);
    if (!cell) return;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.selecting = true;
    this.startCell = cell;
    this.lockedDirection = null;
    this.currentSelection.set([cell]);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.selecting || !this.startCell) return;
    const cell = this.getCellFromEvent(event);
    if (!cell) return;

    const dr = cell.row - this.startCell.row;
    const dc = cell.col - this.startCell.col;

    if (!this.lockedDirection && (dr !== 0 || dc !== 0)) {
      // Lock direction on first move
      this.lockedDirection = this.snapDirection(dr, dc);
    }

    if (!this.lockedDirection) return;

    // Project current position onto locked direction
    const { dx, dy } = this.lockedDirection;
    let steps: number;
    if (dx !== 0 && dy !== 0) {
      steps = Math.round((Math.abs(dr) + Math.abs(dc)) / 2);
    } else if (dx !== 0) {
      steps = Math.abs(dc);
    } else {
      steps = Math.abs(dr);
    }

    // Determine sign
    const rawSign = dx !== 0 ? Math.sign(dc) * Math.sign(dx) : Math.sign(dr) * Math.sign(dy);
    const sign = rawSign >= 0 ? 1 : -1;

    const selection: CellPosition[] = [];
    for (let i = 0; i <= steps; i++) {
      const r = this.startCell.row + i * sign * dy;
      const c = this.startCell.col + i * sign * dx;
      if (r >= 0 && r < this.puzzle().grid.height && c >= 0 && c < this.puzzle().grid.width) {
        selection.push({ row: r, col: c });
      }
    }
    this.currentSelection.set(selection);
  }

  onPointerUp(_event: PointerEvent): void {
    if (!this.selecting) return;
    this.selecting = false;

    const sel = this.currentSelection();
    if (sel.length >= 2) {
      const selectedWord = sel.map((c) => this.puzzle().grid.cells[c.row][c.col].letter).join('');
      const reversedWord = [...selectedWord].reverse().join('');

      const match = this.puzzle().words.find(
        (w) => w === selectedWord || w === reversedWord,
      );
      if (match && !this.foundWords().has(match)) {
        this.assignColor(match);
        this.wordSelected.emit(match);
      }
    }

    this.currentSelection.set([]);
    this.startCell = null;
    this.lockedDirection = null;
  }

  isSelecting(row: number, col: number): boolean {
    return this.currentSelection().some((c) => c.row === row && c.col === col);
  }

  isFound(row: number, col: number): boolean {
    for (const pw of this.puzzle().grid.placedWords) {
      if (this.foundWords().has(pw.word)) {
        if (pw.cells.some((c) => c.row === row && c.col === col)) return true;
      }
    }
    return false;
  }

  getFoundColor(row: number, col: number): string {
    for (const pw of this.puzzle().grid.placedWords) {
      if (this.foundWords().has(pw.word)) {
        if (pw.cells.some((c) => c.row === row && c.col === col)) {
          return this.foundColorMap.get(pw.word) || WORD_COLORS[0];
        }
      }
    }
    return 'transparent';
  }

  getHighlights(row: number, col: number): string[] {
    const colors: string[] = [];
    for (const pw of this.puzzle().grid.placedWords) {
      if (this.foundWords().has(pw.word)) {
        if (pw.cells.some((c) => c.row === row && c.col === col)) {
          colors.push(this.foundColorMap.get(pw.word) || WORD_COLORS[0]);
        }
      }
    }
    return colors;
  }

  private assignColor(word: string): void {
    if (!this.foundColorMap.has(word)) {
      this.foundColorMap.set(word, WORD_COLORS[this.foundColorMap.size % WORD_COLORS.length]);
    }
  }

  private getCellFromEvent(event: PointerEvent): CellPosition | null {
    const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (!el) return null;
    const cellEl = el.closest('[data-row]') as HTMLElement | null;
    if (!cellEl) return null;
    return {
      row: Number(cellEl.dataset['row']),
      col: Number(cellEl.dataset['col']),
    };
  }

  private snapDirection(dr: number, dc: number): { dx: number; dy: number } {
    const angle = Math.atan2(dr, dc);
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    return {
      dx: Math.round(Math.cos(snapped)),
      dy: Math.round(Math.sin(snapped)),
    };
  }
}
