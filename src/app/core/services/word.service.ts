import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import type { Word } from '../database/database.models';

@Injectable({ providedIn: 'root' })
export class WordService {
  constructor(private db: DatabaseService) {}

  async getWords(libraryId: number): Promise<Word[]> {
    return this.db.words.where('libraryId').equals(libraryId).toArray();
  }

  async getWordCount(libraryId: number): Promise<number> {
    return this.db.words.where('libraryId').equals(libraryId).count();
  }

  async addWord(libraryId: number, word: string): Promise<{ success: boolean; error?: string }> {
    const normalized = word.toUpperCase().trim();
    if (!this.isValidWord(normalized)) {
      return { success: false, error: 'Ongeldig woord. Gebruik alleen letters (A-Z), 2-15 tekens.' };
    }

    const existing = await this.db.words
      .where('[libraryId+word]')
      .equals([libraryId, normalized])
      .first();
    if (existing) {
      return { success: false, error: 'Dit woord bestaat al in deze bibliotheek.' };
    }

    await this.db.words.add({ libraryId, word: normalized });
    return { success: true };
  }

  async addWords(libraryId: number, words: string[]): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    const existingWords = new Set(
      (await this.getWords(libraryId)).map((w) => w.word),
    );

    const toAdd: { libraryId: number; word: string }[] = [];
    for (const raw of words) {
      const word = raw.toUpperCase().trim();
      if (!this.isValidWord(word) || existingWords.has(word)) {
        skipped++;
        continue;
      }
      existingWords.add(word);
      toAdd.push({ libraryId, word });
      added++;
    }

    if (toAdd.length > 0) {
      await this.db.words.bulkAdd(toAdd);
    }
    return { added, skipped };
  }

  async removeWord(id: number): Promise<void> {
    await this.db.words.delete(id);
  }

  async removeWords(ids: number[]): Promise<void> {
    await this.db.words.bulkDelete(ids);
  }

  async searchWords(libraryId: number, query: string): Promise<Word[]> {
    const upper = query.toUpperCase().trim();
    const words = await this.getWords(libraryId);
    return words.filter((w) => w.word.includes(upper));
  }

  async getRandomWords(libraryId: number, count: number): Promise<string[]> {
    const words = await this.getWords(libraryId);
    const shuffled = words.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((w) => w.word);
  }

  private isValidWord(word: string): boolean {
    return /^[A-Z]{2,15}$/.test(word);
  }
}
