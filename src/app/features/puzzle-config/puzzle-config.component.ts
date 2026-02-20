import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { PuzzleDefinitionService } from '../../core/services/puzzle-definition.service';
import { NotificationService } from '../../core/services/notification.service';
import type { WordLibrary } from '../../core/database/database.models';

@Component({
  selector: 'app-puzzle-config',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSliderModule, MatButtonModule, MatIconModule, MatCheckboxModule,
  ],
  template: `
    <div class="config-page">
      <h1>{{ isEditing() ? 'Puzzel Bewerken' : 'Nieuwe Puzzel' }}</h1>

      <div class="config-layout">
        <mat-card class="config-form">
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Puzzelnaam</mat-label>
              <input matInput [(ngModel)]="name" required maxlength="50"
                     placeholder="Bijv. Makkelijke Woordzoeker" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Bibliotheek</mat-label>
              <mat-select [(ngModel)]="selectedLibraryId" (selectionChange)="onLibraryChange()">
                @for (lib of libraries(); track lib.id) {
                  <mat-option [value]="lib.id">
                    {{ lib.name }} ({{ lib.wordCount }} woorden)
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="slider-group">
              <label>Breedte: {{ gridWidth }}</label>
              <mat-slider min="8" max="25" step="1" discrete>
                <input matSliderThumb [(ngModel)]="gridWidth" />
              </mat-slider>
            </div>

            <div class="slider-group">
              <label>Hoogte: {{ gridHeight }}</label>
              <mat-slider min="8" max="25" step="1" discrete>
                <input matSliderThumb [(ngModel)]="gridHeight" />
              </mat-slider>
            </div>

            <mat-checkbox [(ngModel)]="squareGrid" (change)="onSquareToggle()">
              Vierkant raster
            </mat-checkbox>

            <div class="slider-group">
              <label>Aantal woorden: {{ wordCount }}</label>
              <mat-slider [min]="3" [max]="maxWordCount()" step="1" discrete>
                <input matSliderThumb [(ngModel)]="wordCount" />
              </mat-slider>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="preview-card">
          <mat-card-header>
            <mat-card-title>Voorvertoning</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="grid-preview"
                 [style.grid-template-columns]="'repeat(' + gridWidth + ', 1fr)'"
                 [style.aspect-ratio]="gridWidth + '/' + gridHeight">
              @for (i of gridCells(); track i) {
                <div class="preview-cell"></div>
              }
            </div>
            <div class="preview-info">
              <p><strong>{{ gridWidth }} × {{ gridHeight }}</strong> = {{ gridWidth * gridHeight }} cellen</p>
              <p><strong>{{ wordCount }}</strong> woorden</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="actions">
        <button mat-flat-button (click)="saveAndPlay()" [disabled]="!isValid()">
          <mat-icon>play_arrow</mat-icon> Opslaan & Spelen
        </button>
        <button mat-stroked-button (click)="saveOnly()" [disabled]="!isValid()">
          <mat-icon>save</mat-icon> Alleen Opslaan
        </button>
        <button mat-flat-button (click)="playWithoutSaving()" [disabled]="!isValid()">
          <mat-icon>casino</mat-icon> Spelen zonder Opslaan
        </button>
      </div>
    </div>
  `,
  styles: `
    .config-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { font-size: 2rem; margin-bottom: 24px; }
    .config-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 768px) {
      .config-layout { grid-template-columns: 1fr; }
    }
    .config-form, .preview-card { padding: 24px; }
    .full-width { width: 100%; }
    .slider-group {
      margin: 16px 0;
      label { display: block; font-weight: 500; margin-bottom: 8px; }
      mat-slider { width: 100%; }
    }
    .grid-preview {
      display: grid;
      gap: 1px;
      background: var(--mat-sys-outline-variant);
      border: 2px solid var(--mat-sys-outline);
      border-radius: 8px;
      overflow: hidden;
      max-width: 300px;
      margin: 16px auto;
    }
    .preview-cell {
      background: var(--mat-sys-surface);
      aspect-ratio: 1;
    }
    .preview-info {
      text-align: center;
      margin-top: 16px;
      p { margin: 4px 0; }
    }
    .actions {
      display: flex;
      gap: 16px;
      margin-top: 32px;
      justify-content: center;
      flex-wrap: wrap;
      button { height: 56px; font-size: 1rem; }
    }
  `,
})
export class PuzzleConfigComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private libraryService = inject(LibraryService);
  private defService = inject(PuzzleDefinitionService);
  private notification = inject(NotificationService);

  isEditing = signal(false);
  editId: number | null = null;

  name = '';
  selectedLibraryId: number | null = null;
  gridWidth = 12;
  gridHeight = 12;
  wordCount = 8;
  squareGrid = true;
  libraries = signal<(WordLibrary & { wordCount: number })[]>([]);

  maxWordCount = signal(20);
  gridCells = signal<number[]>([]);

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const libs = await this.libraryService.getLibraryWithWordCount(user.id);
    this.libraries.set(libs);

    if (libs.length > 0) {
      this.selectedLibraryId = libs[0].id!;
      this.updateMaxWordCount();
    }

    const editId = this.route.snapshot.paramMap.get('id');
    if (editId) {
      const def = await this.defService.getDefinition(Number(editId));
      if (def) {
        this.isEditing.set(true);
        this.editId = def.id!;
        this.name = def.name;
        this.selectedLibraryId = def.libraryId;
        this.gridWidth = def.gridWidth;
        this.gridHeight = def.gridHeight;
        this.wordCount = def.wordCount;
        this.squareGrid = def.gridWidth === def.gridHeight;
      }
    }

    this.updateGridCells();
  }

  onLibraryChange(): void {
    this.updateMaxWordCount();
  }

  onSquareToggle(): void {
    if (this.squareGrid) {
      this.gridHeight = this.gridWidth;
    }
    this.updateGridCells();
  }

  updateMaxWordCount(): void {
    const lib = this.libraries().find((l) => l.id === this.selectedLibraryId);
    const gridMax = Math.min(this.gridWidth, this.gridHeight) * 2;
    const libMax = lib?.wordCount ?? 20;
    this.maxWordCount.set(Math.min(gridMax, libMax, 30));
    if (this.wordCount > this.maxWordCount()) {
      this.wordCount = this.maxWordCount();
    }
  }

  updateGridCells(): void {
    this.gridCells.set(Array.from({ length: this.gridWidth * this.gridHeight }, (_, i) => i));
  }

  isValid(): boolean {
    return !!this.name.trim() && !!this.selectedLibraryId && this.wordCount >= 3;
  }

  async saveAndPlay(): Promise<void> {
    const id = await this.save();
    if (id) this.router.navigate(['/puzzle/play', id]);
  }

  async saveOnly(): Promise<void> {
    const id = await this.save();
    if (id) {
      this.notification.success('Puzzeldefinitie opgeslagen!');
      this.router.navigate(['/puzzle/definitions']);
    }
  }

  async playWithoutSaving(): Promise<void> {
    // Navigate with query params instead of saved definition
    this.router.navigate(['/puzzle/play'], {
      queryParams: {
        libraryId: this.selectedLibraryId,
        width: this.gridWidth,
        height: this.gridHeight,
        wordCount: this.wordCount,
      },
    });
  }

  private async save(): Promise<number | null> {
    const user = this.auth.currentUser();
    if (!user) return null;

    if (this.isEditing() && this.editId) {
      await this.defService.updateDefinition(this.editId, {
        name: this.name,
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight,
        wordCount: this.wordCount,
        libraryId: this.selectedLibraryId!,
      });
      return this.editId;
    }

    return this.defService.createDefinition({
      userId: user.id,
      name: this.name,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      wordCount: this.wordCount,
      libraryId: this.selectedLibraryId!,
    });
  }
}
