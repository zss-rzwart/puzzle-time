import { Direction } from './direction.model';

export interface Cell {
  row: number;
  col: number;
  letter: string;
  isPartOfWord: boolean;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  cells: CellPosition[];
}

export interface PuzzleGrid {
  width: number;
  height: number;
  cells: Cell[][];
  placedWords: PlacedWord[];
}

export interface GeneratedPuzzle {
  grid: PuzzleGrid;
  words: string[];
}
