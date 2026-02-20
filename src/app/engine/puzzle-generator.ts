import type { Cell, GeneratedPuzzle, PuzzleGrid } from './grid.model';
import { getValidPlacements, placeWord } from './word-placer';

// Dutch letter frequency distribution
const DUTCH_LETTER_FREQ: [string, number][] = [
  ['E', 18.91], ['N', 10.03], ['A', 7.49], ['T', 6.79], ['I', 6.50],
  ['R', 6.41], ['O', 6.06], ['D', 5.93], ['S', 3.73], ['L', 3.57],
  ['G', 3.40], ['V', 2.85], ['H', 2.38], ['K', 2.25], ['M', 2.21],
  ['U', 1.99], ['B', 1.58], ['P', 1.57], ['W', 1.52], ['J', 1.46],
  ['Z', 1.39], ['C', 1.24], ['F', 0.81], ['X', 0.04], ['Y', 0.03], ['Q', 0.01],
];

const CUMULATIVE_FREQ: { letter: string; cumulative: number }[] = [];
let total = 0;
for (const [letter, freq] of DUTCH_LETTER_FREQ) {
  total += freq;
  CUMULATIVE_FREQ.push({ letter, cumulative: total });
}

function randomDutchLetter(): string {
  const r = Math.random() * total;
  for (const { letter, cumulative } of CUMULATIVE_FREQ) {
    if (r <= cumulative) return letter;
  }
  return 'E';
}

function createEmptyGrid(width: number, height: number): PuzzleGrid {
  const cells: Cell[][] = [];
  for (let row = 0; row < height; row++) {
    cells[row] = [];
    for (let col = 0; col < width; col++) {
      cells[row][col] = { row, col, letter: '', isPartOfWord: false };
    }
  }
  return { width, height, cells, placedWords: [] };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillEmptyCells(grid: PuzzleGrid): void {
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      if (grid.cells[row][col].letter === '') {
        grid.cells[row][col].letter = randomDutchLetter();
      }
    }
  }
}

export function generatePuzzle(
  width: number,
  height: number,
  words: string[],
): GeneratedPuzzle {
  const maxAttempts = 10;
  let bestGrid: PuzzleGrid | null = null;
  let bestPlacedWords: string[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = createEmptyGrid(width, height);
    const placedWords: string[] = [];
    const shuffledWords = shuffle(words);

    // Sort by length descending — place longest words first
    shuffledWords.sort((a, b) => b.length - a.length);

    for (const word of shuffledWords) {
      const placements = getValidPlacements(grid, word);
      if (placements.length === 0) continue;

      // Prefer placements with more overlaps for denser puzzles
      placements.sort((a, b) => b.overlapCount - a.overlapCount);
      const topCandidates = placements.slice(0, Math.max(3, Math.floor(placements.length * 0.1)));
      const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

      const cells = placeWord(grid, word, chosen.row, chosen.col, chosen.direction);
      grid.placedWords.push({
        word,
        startRow: chosen.row,
        startCol: chosen.col,
        direction: chosen.direction,
        cells,
      });
      placedWords.push(word);
    }

    if (placedWords.length >= words.length) {
      fillEmptyCells(grid);
      return { grid, words: placedWords };
    }

    if (!bestGrid || placedWords.length > bestPlacedWords.length) {
      bestGrid = grid;
      bestPlacedWords = placedWords;
    }
  }

  // Return best attempt
  fillEmptyCells(bestGrid!);
  return { grid: bestGrid!, words: bestPlacedWords };
}
