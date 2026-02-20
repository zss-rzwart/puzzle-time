import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { User, WordLibrary, Word, PuzzleDefinition } from './database.models';

@Injectable({ providedIn: 'root' })
export class DatabaseService extends Dexie {
  users!: Table<User, number>;
  libraries!: Table<WordLibrary, number>;
  words!: Table<Word, number>;
  puzzleDefinitions!: Table<PuzzleDefinition, number>;

  constructor() {
    super('PuzzleTimeDB');

    this.version(1).stores({
      users: '++id, &username',
      libraries: '++id, userId, [userId+isDefault]',
      words: '++id, libraryId, [libraryId+word]',
      puzzleDefinitions: '++id, userId',
    });
  }
}
