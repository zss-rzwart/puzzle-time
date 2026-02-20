import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import type { WordLibrary } from '../database/database.models';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  constructor(private db: DatabaseService) {}

  async getLibraries(userId: number): Promise<WordLibrary[]> {
    return this.db.libraries.where('userId').equals(userId).toArray();
  }

  async getLibrary(id: number): Promise<WordLibrary | undefined> {
    return this.db.libraries.get(id);
  }

  async createLibrary(
    userId: number,
    name: string,
    description: string,
    isDefault = false,
  ): Promise<number> {
    const now = new Date();
    return this.db.libraries.add({
      userId,
      name,
      description,
      isDefault,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateLibrary(id: number, name: string, description: string): Promise<void> {
    await this.db.libraries.update(id, { name, description, updatedAt: new Date() });
  }

  async deleteLibrary(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.libraries, this.db.words, async () => {
      await this.db.words.where('libraryId').equals(id).delete();
      await this.db.libraries.delete(id);
    });
  }

  async getLibraryWithWordCount(
    userId: number,
  ): Promise<(WordLibrary & { wordCount: number })[]> {
    const libs = await this.getLibraries(userId);
    const counts = await Promise.all(
      libs.map((lib) => this.db.words.where('libraryId').equals(lib.id!).count()),
    );
    return libs.map((lib, i) => ({ ...lib, wordCount: counts[i] }));
  }

  async seedDefaultLibrary(userId: number): Promise<void> {
    const existing = await this.db.libraries
      .where('userId')
      .equals(userId)
      .filter((lib) => lib.isDefault)
      .first();
    if (existing) return;

    const response = await fetch('/assets/data/dutch-words.json');
    const data: { name: string; description: string; words: string[] } = await response.json();

    await this.db.transaction('rw', this.db.libraries, this.db.words, async () => {
      const libId = await this.db.libraries.add({
        userId,
        name: data.name,
        description: data.description,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const words = data.words.map((word) => ({
        libraryId: libId,
        word: word.toUpperCase().trim(),
      }));
      await this.db.words.bulkAdd(words);
    });
  }
}
