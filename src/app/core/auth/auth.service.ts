import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { DatabaseService } from '../database/database.service';
import type { AuthToken } from './auth.models';

const JWT_SECRET = new TextEncoder().encode('puzzle-time-local-secret-key-2026');
const TOKEN_KEY = 'puzzle_time_token';
const SALT_ROUNDS = 12;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenPayload = signal<AuthToken | null>(null);

  readonly currentUser = computed(() => {
    const payload = this.tokenPayload();
    return payload ? { id: payload.sub, username: payload.username } : null;
  });

  readonly isAuthenticated = computed(() => this.tokenPayload() !== null);

  constructor(
    private db: DatabaseService,
    private router: Router,
  ) {
    this.loadTokenFromStorage();
  }

  async register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    const existing = await this.db.users.where('username').equals(username).first();
    if (existing) {
      return { success: false, error: 'Gebruikersnaam is al in gebruik' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = await this.db.users.add({
      username,
      passwordHash,
      createdAt: new Date(),
    });

    await this.createAndStoreToken(id, username);
    return { success: true };
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    const user = await this.db.users.where('username').equals(username).first();
    if (!user) {
      return { success: false, error: 'Ongeldige gebruikersnaam of wachtwoord' };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: 'Ongeldige gebruikersnaam of wachtwoord' };
    }

    await this.createAndStoreToken(user.id!, user.username);
    return { success: true };
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenPayload.set(null);
    this.router.navigate(['/login']);
  }

  private async createAndStoreToken(userId: number, username: string): Promise<void> {
    const token = await new SignJWT({ sub: userId, username } as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    localStorage.setItem(TOKEN_KEY, token);
    this.tokenPayload.set({ sub: userId, username, iat: Date.now(), exp: Date.now() + 7 * 86400000 });
  }

  private async loadTokenFromStorage(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      this.tokenPayload.set({
        sub: payload.sub as unknown as number,
        username: payload['username'] as string,
        iat: payload.iat!,
        exp: payload.exp!,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this.tokenPayload.set(null);
    }
  }
}
