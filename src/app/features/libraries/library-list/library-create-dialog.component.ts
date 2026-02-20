import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-library-create-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Nieuwe Bibliotheek</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Naam</mat-label>
        <input matInput [(ngModel)]="name" required maxlength="50" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Beschrijving</mat-label>
        <textarea matInput [(ngModel)]="description" maxlength="200" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuleren</button>
      <button mat-flat-button [disabled]="!name.trim()"
              (click)="create()">Aanmaken</button>
    </mat-dialog-actions>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class LibraryCreateDialogComponent {
  private dialogRef = inject(MatDialogRef<LibraryCreateDialogComponent>);

  name = '';
  description = '';

  create(): void {
    this.dialogRef.close({ name: this.name.trim(), description: this.description.trim() });
  }
}
