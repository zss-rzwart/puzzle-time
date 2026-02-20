import { Direction, DIRECTION_VECTORS } from './direction.model';
import type { Cell, CellPosition, PuzzleGrid } from './grid.model';

export interface Placement {
  row: number;
  col: number;
  direction: Direction;
  overlapCount: number;
}

export function canPlaceWord(
  grid: PuzzleGrid,
  word: string,
  row: number,
  col: number,
  direction: Direction,
): boolean {
  const { dx, dy } = DIRECTION_VECTORS[direction];
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dy;
    const c = col + i * dx;
    if (r < 0 || r >= grid.height || c < 0 || c >= grid.width) return false;
    const existing = grid.cells[r][c].letter;
    if (existing !== '' && existing !== word[i]) return false;
  }
  return true;
}

export function placeWord(
  grid: PuzzleGrid,
  word: string,
  row: number,
  col: number,
  direction: Direction,
): CellPosition[] {
  const { dx, dy } = DIRECTION_VECTORS[direction];
  const cells: CellPosition[] = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dy;
    const c = col + i * dx;
    grid.cells[r][c].letter = word[i];
    grid.cells[r][c].isPartOfWord = true;
    cells.push({ row: r, col: c });
  }
  return cells;
}

export function getValidPlacements(grid: PuzzleGrid, word: string): Placement[] {
  const placements: Placement[] = [];
  const directions = Object.values(Direction);

  for (const direction of directions) {
    const { dx, dy } = DIRECTION_VECTORS[direction];
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const endRow = row + (word.length - 1) * dy;
        const endCol = col + (word.length - 1) * dx;
        if (endRow < 0 || endRow >= grid.height || endCol < 0 || endCol >= grid.width) continue;

        if (canPlaceWord(grid, word, row, col, direction)) {
          let overlapCount = 0;
          for (let i = 0; i < word.length; i++) {
            const r = row + i * dy;
            const c = col + i * dx;
            if (grid.cells[r][c].letter === word[i]) overlapCount++;
          }
          placements.push({ row, col, direction, overlapCount });
        }
      }
    }
  }
  return placements;
}
