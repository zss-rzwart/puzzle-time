export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface WordLibrary {
  id?: number;
  userId: number;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Word {
  id?: number;
  libraryId: number;
  word: string;
}

export interface PuzzleDefinition {
  id?: number;
  userId: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  wordCount: number;
  libraryId: number;
  createdAt: Date;
  updatedAt: Date;
}
