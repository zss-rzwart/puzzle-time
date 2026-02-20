import { Component, input, output, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-congratulations',
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="congrats-overlay" #overlay>
      <canvas #confettiCanvas class="confetti-canvas"></canvas>
      <mat-card class="congrats-card">
        <div class="congrats-emoji">🎉</div>
        <h1>Gefeliciteerd!</h1>
        <p class="subtitle">Je hebt alle {{ wordCount() }} woorden gevonden!</p>
        <p class="puzzle-name">{{ puzzleName() }}</p>
        <p class="time">Tijd: {{ time() }}</p>

        <div class="actions">
          <button mat-flat-button (click)="playAgain.emit()">
            <mat-icon>refresh</mat-icon> Opnieuw Spelen
          </button>
          <button mat-stroked-button (click)="newPuzzle.emit()">
            <mat-icon>add</mat-icon> Nieuwe Puzzel
          </button>
          <button mat-stroked-button (click)="goHome.emit()">
            <mat-icon>home</mat-icon> Dashboard
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: `
    .congrats-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      animation: fadeIn 0.4s ease;
    }
    .confetti-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .congrats-card {
      position: relative;
      z-index: 1;
      text-align: center;
      padding: 48px;
      max-width: 500px;
      width: 90%;
      animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    }
    .congrats-emoji {
      font-size: 72px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.5rem;
      color: var(--mat-sys-primary);
      margin: 0 0 8px;
    }
    .subtitle { font-size: 1.2rem; margin: 0 0 4px; }
    .puzzle-name {
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
    }
    .time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.3rem;
      margin: 16px 0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
      button { height: 52px; font-size: 1rem; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes bounceIn {
      from { transform: scale(0.3); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
})
export class CongratulationsComponent implements AfterViewInit {
  wordCount = input.required<number>();
  time = input.required<string>();
  puzzleName = input.required<string>();

  playAgain = output<void>();
  newPuzzle = output<void>();
  goHome = output<void>();

  private confettiCanvas = viewChild<ElementRef<HTMLCanvasElement>>('confettiCanvas');

  ngAfterViewInit(): void {
    this.launchConfetti();
  }

  private launchConfetti(): void {
    const canvas = this.confettiCanvas()?.nativeElement;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, { resize: true });
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      myConfetti({
        particleCount: 3,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: ['#EF5350', '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
      });
      myConfetti({
        particleCount: 3,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: ['#EF5350', '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
