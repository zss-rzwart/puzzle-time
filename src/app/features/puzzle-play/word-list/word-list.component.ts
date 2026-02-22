import { Component, input, computed } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-word-list',
  imports: [MatListModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="word-list-panel">
      <div class="progress-header">
        <span>{{ foundCount() }} / {{ words().length }} woorden</span>
        <mat-progress-bar mode="determinate" [value]="progressPercent()" />
      </div>

      <mat-list>
        @for (word of sortedWords(); track word) {
          <mat-list-item [class.found]="isFound(word)">
            <mat-icon matListItemIcon>
              {{ isFound(word) ? 'check_circle' : 'radio_button_unchecked' }}
            </mat-icon>
            <span [class.strikethrough]="isFound(word)">{{ word }}</span>
          </mat-list-item>
        }
      </mat-list>
    </div>
  `,
  styles: `
    .word-list-panel {
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .progress-header {
      margin-bottom: 16px;
      span {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 1.1rem;
      }
    }
    mat-list { overflow-y: auto; flex: 1; }
    .found {
      mat-icon { color: var(--mat-sys-primary); }
    }
    .strikethrough {
      text-decoration: line-through;
      opacity: 0.6;
    }
    mat-list-item {
      font-size: 1.1rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    @media (max-width: 768px) {
      .word-list-panel { padding: 8px; }
      .progress-header { margin-bottom: 8px; span { font-size: 0.95rem; } }
      mat-list { display: grid; grid-template-columns: 1fr 1fr; }
      mat-list-item { font-size: 0.9rem; }
    }
  `,
})
export class WordListComponent {
  words = input.required<string[]>();
  foundWords = input.required<Set<string>>();

  sortedWords = computed(() => [...this.words()].sort((a, b) => a.localeCompare(b)));
  foundCount = computed(() => this.foundWords().size);
  progressPercent = computed(() => {
    const total = this.words().length;
    return total > 0 ? (this.foundCount() / total) * 100 : 0;
  });

  isFound(word: string): boolean {
    return this.foundWords().has(word);
  }
}
