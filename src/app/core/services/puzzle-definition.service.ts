import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import type { PuzzleDefinition } from '../database/database.models';

@Injectable({ providedIn: 'root' })
export class PuzzleDefinitionService {
  constructor(private db: DatabaseService) {}

  async getDefinitions(userId: number): Promise<PuzzleDefinition[]> {
    return this.db.puzzleDefinitions.where('userId').equals(userId).toArray();
  }

  async getDefinition(id: number): Promise<PuzzleDefinition | undefined> {
    return this.db.puzzleDefinitions.get(id);
  }

  async createDefinition(def: Omit<PuzzleDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return this.db.puzzleDefinitions.add({
      ...def,
      createdAt: now,
      updatedAt: now,
    } as PuzzleDefinition);
  }

  async updateDefinition(id: number, changes: Partial<PuzzleDefinition>): Promise<void> {
    await this.db.puzzleDefinitions.update(id, { ...changes, updatedAt: new Date() });
  }

  async deleteDefinition(id: number): Promise<void> {
    await this.db.puzzleDefinitions.delete(id);
  }

  async duplicateDefinition(id: number): Promise<number> {
    const original = await this.getDefinition(id);
    if (!original) throw new Error('Puzzeldefinitie niet gevonden');

    return this.createDefinition({
      userId: original.userId,
      name: `Kopie van ${original.name}`,
      gridWidth: original.gridWidth,
      gridHeight: original.gridHeight,
      wordCount: original.wordCount,
      libraryId: original.libraryId,
    });
  }
}
