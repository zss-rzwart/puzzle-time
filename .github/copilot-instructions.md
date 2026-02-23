# Puzzle Time – Copilot Instructions

## Application overview

Puzzle Time is a **Dutch-language word search puzzle (woordzoeker) Progressive Web App (PWA)** built with Angular 21.
Users can create and manage word libraries, configure puzzle definitions, and play generated word search puzzles in the browser.
All data is stored **locally in the browser** (IndexedDB via Dexie). There is no back-end API or cloud database.
The app is deployed as an **Azure Static Web App**.

---

## Technology stack

| Layer | Library / version |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| UI components | Angular Material 21 (`@angular/material`) |
| Local database | Dexie 4 (IndexedDB wrapper) |
| Auth tokens | `jose` 6 (JWT sign / verify, HS256) |
| Password hashing | `bcryptjs` 3 (12 salt rounds) |
| Confetti animation | `canvas-confetti` |
| Icons | `material-icons` (iconfont) |
| Fonts | Roboto, JetBrains Mono (Google Fonts) |
| Tests | Vitest (via `@angular/build:unit-test`) |
| Build / CLI | Angular CLI 21 / `@angular/build` |

> The UI language is **Dutch (nl)**. All user-visible text, error messages, labels, and comments are written in Dutch.

---

## Project structure

```
puzzle-time/
├── .github/
│   └── copilot-instructions.md   ← this file
├── public/                        ← static assets copied verbatim to dist root
│   ├── manifest.webmanifest
│   ├── favicon.ico
│   └── icons/                    ← PWA icons (72–512 px)
├── src/
│   ├── index.html                 ← app shell; lang="nl", viewport-fit=cover
│   ├── main.ts                    ← bootstraps AppConfig
│   ├── styles.scss                ← global styles, Material theme, touch targets
│   └── assets/
│       └── data/
│           └── dutch-words.json  ← default word library seeded on first login
│   └── app/
│       ├── app.ts                 ← root component (navbar + router-outlet)
│       ├── app.config.ts          ← provideBrowserGlobalErrorListeners, provideRouter, provideAnimationsAsync, provideServiceWorker
│       ├── app.routes.ts          ← lazy-loaded route definitions
│       ├── core/
│       │   ├── auth/
│       │   │   ├── auth.models.ts       ← LoginRequest, RegisterRequest, AuthToken interfaces
│       │   │   ├── auth.service.ts      ← JWT sign/verify, bcrypt, localStorage token
│       │   │   └── auth.guard.ts        ← authGuard, guestGuard (functional, async)
│       │   ├── database/
│       │   │   ├── database.models.ts   ← User, WordLibrary, Word, PuzzleDefinition interfaces
│       │   │   └── database.service.ts  ← Dexie subclass; tables: users, libraries, words, puzzleDefinitions
│       │   └── services/
│       │       ├── library.service.ts          ← WordLibrary CRUD + default seeding
│       │       ├── word.service.ts             ← Word CRUD, validation, random selection
│       │       ├── puzzle-definition.service.ts ← PuzzleDefinition CRUD + duplicate
│       │       └── notification.service.ts     ← MatSnackBar wrapper (success/error/info)
│       ├── engine/
│       │   ├── direction.model.ts   ← Direction enum + DIRECTION_VECTORS
│       │   ├── grid.model.ts        ← Cell, PlacedWord, PuzzleGrid, GeneratedPuzzle interfaces
│       │   ├── word-placer.ts       ← canPlaceWord, placeWord, getValidPlacements
│       │   └── puzzle-generator.ts  ← generatePuzzle (Dutch letter fill, up to 10 attempts)
│       ├── features/
│       │   ├── auth/
│       │   │   ├── login/login.component.ts
│       │   │   └── register/register.component.ts
│       │   ├── dashboard/dashboard.component.ts
│       │   ├── libraries/
│       │   │   ├── library-list/
│       │   │   │   ├── library-list.component.ts
│       │   │   │   └── library-create-dialog.component.ts
│       │   │   ├── library-detail/library-detail.component.ts
│       │   │   └── word-manager/word-manager.component.ts
│       │   ├── puzzle-config/
│       │   │   ├── puzzle-config.component.ts
│       │   │   └── puzzle-definition-list/puzzle-definition-list.component.ts
│       │   └── puzzle-play/
│       │       ├── puzzle-play.component.ts
│       │       ├── puzzle-grid/puzzle-grid.component.ts
│       │       ├── word-list/word-list.component.ts
│       │       └── congratulations/congratulations.component.ts
│       └── shared/
│           └── components/
│               ├── navbar/navbar.component.ts
│               └── confirm-dialog/confirm-dialog.component.ts
├── angular.json
├── ngsw-config.json               ← Angular Service Worker asset caching config
├── staticwebapp.config.json       ← Azure SWA routing, CSP headers, caching
└── package.json
```

---

## Angular patterns

- **Standalone components** — every component uses `standalone: true` (implicit in Angular 17+ when using `imports: []` without `NgModule`).
- **Signals** — reactive state is managed with `signal()`, `computed()`, and `input()`/`output()` from `@angular/core`. Services and components do **not** use RxJS `BehaviorSubject` for state.
- **Inline templates and styles** — all components use `template: \`...\`` and `styles: \`...\`` (no separate `.html` / `.scss` files per component).
- **Lazy-loaded routes** — all feature routes use `loadComponent: () => import(...)`.
- **`inject()`** — use `inject()` inside constructors / field initialisers instead of constructor parameter injection where possible.
- **Async `ngOnInit`** — `ngOnInit(): Promise<void>` is used for data loading; `await` on Dexie queries is idiomatic here.
- **Angular 21 `@for` / `@if` / `@switch`** — use the new template control flow syntax, not `*ngFor` / `*ngIf`.

---

## UI and Angular Material

- **Theme** — defined in `src/styles.scss` with `mat.theme()`: primary = `$cyan-palette`, tertiary = `$orange-palette`, typography = Roboto, density = 0.
- **CSS variables** — use `var(--mat-sys-*)` tokens (e.g. `var(--mat-sys-primary)`, `var(--mat-sys-surface)`, `var(--mat-sys-on-surface-variant)`) for theming rather than hard-coded colours.
- **Navbar height** — `--navbar-height: 64px` is set on `<html>` and used in height calculations.
- **Notifications** — use `NotificationService` (a `MatSnackBar` wrapper) for all user-facing feedback. Call `notification.success()`, `notification.error()`, or `notification.info()`.
- **Confirmation dialogs** — use `ConfirmDialogComponent` (opened via `MatDialog`) for destructive actions.
- **Touch targets** — every `button`, `a`, and `[role="button"]` has `min-height: 48px; min-width: 48px` enforced globally in `styles.scss`.

---

## Responsive layout and display views

The **mobile breakpoint** is **768 px**. Use `@media (max-width: 768px)` for mobile overrides.

### Desktop (> 768 px)
- Full horizontal navigation links in the navbar.
- Grid layouts with multiple columns (e.g. `repeat(3, 1fr)` on the dashboard, `repeat(auto-fill, minmax(340px, 1fr))` on lists).
- Puzzle play: side-by-side grid (flex 2) + word list (flex 1, max 360 px).

### Mobile portrait (`@media (max-width: 768px) and (orientation: portrait)`)
- Hamburger menu replaces desktop nav links in the navbar.
- Dashboard quick-actions use `repeat(auto-fit, minmax(100px, 1fr))`.
- Puzzle play stacks grid above word list (`flex-direction: column`). Grid panel height = `100vw − 16px` (full width minus padding).

### Mobile landscape (`@media (max-width: 768px) and (orientation: landscape)`)
- Puzzle play keeps side-by-side layout; word panel gets `max-width: 50%`.

### Tablet (> 768 px, touch device)
- Treated the same as desktop for layout purposes. The 48 px touch target rule ensures usability.

### PWA / full-height layouts
- Use `height: calc(100dvh - var(--navbar-height) - env(safe-area-inset-bottom))` for full-height containers inside the puzzle play view.
- `index.html` sets `viewport-fit=cover` and the iOS `apple-mobile-web-app-capable` meta tags.
- `styles.scss` applies `padding-bottom: env(safe-area-inset-bottom)` to `body` globally.

---

## Authentication

Authentication is **entirely client-side** — there is no server. User credentials are stored in the browser's IndexedDB.

### Flow
1. **Register** (`/register`): user enters username (≥3 chars), password (≥8 chars, 1 uppercase, 1 digit) and confirmation. Password is hashed with bcrypt (12 rounds) and stored in IndexedDB. A JWT is created and stored in `localStorage`.
2. **Login** (`/login`): username looked up in IndexedDB; bcrypt comparison; on success a new JWT is stored in `localStorage`.
3. **Token** — HS256 JWT signed with a hard-coded local secret (`puzzle-time-local-secret-key-2026`). Expiry: 7 days. Token key in `localStorage`: `puzzle_time_token`.
4. **Logout** — removes token from `localStorage`, clears signal, navigates to `/login`.
5. **Persistence** — `AuthService.initialized` is a `Promise<void>` that resolves after `jwtVerify()` is attempted on the stored token at app start. This prevents race conditions on app load.

> **Security note** — the JWT secret is a static string in the source code and intended for local-only use. This app has no server-side validation.

### Route guards
- `authGuard` — awaits `auth.initialized`, then redirects to `/login` if not authenticated.
- `guestGuard` — awaits `auth.initialized`, then redirects to `/dashboard` if already authenticated.
- Both guards are **async functional guards** (`CanActivateFn`).

### `AuthService` signals
| Signal | Type | Description |
|---|---|---|
| `isAuthenticated` | `Signal<boolean>` | true if a valid token payload is loaded |
| `currentUser` | `Signal<{id, username} \| null>` | current user derived from token payload |

---

## Data storage (Dexie / IndexedDB)

`DatabaseService` extends `Dexie` and defines **version 1** with four tables:

| Table | Key | Indexes | Model |
|---|---|---|---|
| `users` | `++id` | `&username` (unique) | `User` |
| `libraries` | `++id` | `userId`, `[userId+isDefault]` | `WordLibrary` |
| `words` | `++id` | `libraryId`, `[libraryId+word]` | `Word` |
| `puzzleDefinitions` | `++id` | `userId` | `PuzzleDefinition` |

**Important Dexie note** — IndexedDB does not support boolean values in compound key queries. Do **not** use `.where('[userId+isDefault]').equals([userId, 1])`. Instead use `.where('userId').equals(userId).filter(lib => lib.isDefault)`.

### Data models
```ts
User            { id?, username, passwordHash, createdAt }
WordLibrary     { id?, userId, name, description, isDefault, createdAt, updatedAt }
Word            { id?, libraryId, word }           // word is always uppercase A-Z
PuzzleDefinition{ id?, userId, name, gridWidth, gridHeight, wordCount, libraryId, createdAt, updatedAt }
```

All data is scoped to the currently logged-in `userId`. Data from different users does not leak between each other.

---

## Word libraries

### Functional
- Each user has one or more **word libraries** (bibliotheken).
- A default Dutch library (`Standaard`) is automatically seeded from `/assets/data/dutch-words.json` on first login or registration.
- Users can create additional libraries, rename them, and delete non-default libraries (with cascading word deletion).
- Within a library, words can be added one by one or in bulk (one per line), searched, and removed.

### Technical
- `LibraryService` — CRUD operations on `DatabaseService.libraries` and `DatabaseService.words`. `seedDefaultLibrary()` fetches the JSON asset and bulk-inserts words inside a Dexie transaction.
- `WordService` — validates words (`/^[A-Z]{2,15}$/`), enforces uniqueness within a library using the compound index `[libraryId+word]`, and provides `getRandomWords()` for puzzle generation.
- `WordManagerComponent` — embedded inside `LibraryDetailComponent`; handles add/bulk-add/search/remove UI and emits `wordCountChanged` to update the displayed word count in the header.

---

## Puzzle definitions

A **puzzle definition** stores the reusable configuration of a puzzle (not the generated grid):

| Field | Description |
|---|---|
| `name` | User-chosen name |
| `gridWidth` / `gridHeight` | Grid dimensions (8–25 cells each) |
| `wordCount` | Number of words to place (3–30, capped by library size and grid dimensions) |
| `libraryId` | Reference to the word library to draw words from |

Definitions are listed at `/puzzle/definitions` and the four most recently updated appear on the dashboard.
Actions: **play**, **edit**, **duplicate** (prefixed `Kopie van …`), **delete**.

---

## Puzzle engine

The engine is pure TypeScript (no Angular dependencies) in `src/app/engine/`.

### Directions
Eight directions are supported: `RIGHT`, `LEFT`, `DOWN`, `UP`, `DOWN_RIGHT`, `DOWN_LEFT`, `UP_RIGHT`, `UP_LEFT`.
Each has a `{ dx, dy }` vector in `DIRECTION_VECTORS` (column delta, row delta).

### Word placement (`word-placer.ts`)
- `getValidPlacements(grid, word)` — enumerates all valid `(row, col, direction)` triples where the word fits without letter conflicts.
- Each placement records an `overlapCount` (number of existing matching letters), used to prefer denser puzzles.
- `placeWord(grid, word, row, col, direction)` — writes letters into cells and marks `isPartOfWord = true`.

### Grid generation (`puzzle-generator.ts`)
1. Words are sorted longest-first and shuffled.
2. For each word, the top 10% of high-overlap placements are candidates; one is chosen randomly.
3. Up to **10 attempts** are made; the attempt that placed the most words is used.
4. Empty cells are filled with **Dutch-frequency-weighted random letters** (e.g. 'E' = 18.91%, 'Q' = 0.01%).

### Play interaction (`puzzle-grid.component.ts`)
- Uses **Pointer Events** (`pointerdown` / `pointermove` / `pointerup`) — works for both mouse and touch without separate touch handlers.
- `touch-action: none` is set on the grid wrapper to suppress browser scroll interference.
- Selection direction is **locked** on the first movement using an 8-way angle snap (`Math.atan2` rounded to π/4 increments).
- Found words are highlighted with one of ten predefined colours stored in a local `foundColorMap`.
- Font size is calculated dynamically based on wrapper width and grid size (clamped to 12–32 px).

### Completion
- When all words are found, the game transitions to the `completed` state after a 600 ms delay.
- `CongratulationsComponent` fires a 4-second canvas-confetti animation and displays the time taken.

---

## Application routes

| Path | Guard | Component |
|---|---|---|
| `/` | — | redirects to `/dashboard` |
| `/login` | `guestGuard` | `LoginComponent` |
| `/register` | `guestGuard` | `RegisterComponent` |
| `/dashboard` | `authGuard` | `DashboardComponent` |
| `/libraries` | `authGuard` | `LibraryListComponent` |
| `/libraries/:id` | `authGuard` | `LibraryDetailComponent` |
| `/puzzle/new` | `authGuard` | `PuzzleConfigComponent` |
| `/puzzle/edit/:id` | `authGuard` | `PuzzleConfigComponent` |
| `/puzzle/definitions` | `authGuard` | `PuzzleDefinitionListComponent` |
| `/puzzle/play/:id` | `authGuard` | `PuzzlePlayComponent` (saved definition) |
| `/puzzle/play` | `authGuard` | `PuzzlePlayComponent` (ad-hoc via query params: `libraryId`, `width`, `height`, `wordCount`) |
| `**` | — | redirects to `/dashboard` |

All feature routes are **lazy-loaded** with `loadComponent`.

---

## PWA and service worker

- The Angular Service Worker (`ngsw-worker.js`) is enabled in production builds, registered with `registerWhenStable:30000`.
- `ngsw-config.json` defines two asset groups:
  - `app` (prefetch): HTML, CSS, JS, manifest.
  - `assets` (lazy / prefetch on update): images and fonts.
- `public/manifest.webmanifest` — standalone display mode PWA with icons from 72 px to 512 px.
- iOS-specific meta tags in `index.html`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.

---

## Deployment: Azure Static Web App

The app is deployed as an **Azure Static Web App** (SWA). Configuration is in `staticwebapp.config.json`:

- **`navigationFallback`** — all non-asset requests rewrite to `/index.html` for Angular client-side routing.
- **Asset caching** — `/assets/*` gets `Cache-Control: public, max-age=31536000, immutable`.
- **Global security headers** applied on every response:
  - `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

**CSP + Angular optimisation** — `angular.json` sets `optimization.styles.inlineCritical: false` in the production build to prevent Angular from injecting an inline `onload` handler for deferred stylesheets, which would be blocked by the `script-src 'self'` policy.

---

## Build, serve, and test commands

```bash
# Serve locally (development mode, no service worker)
npx ng serve

# Production build → dist/puzzle-time/browser/
npx ng build

# Run unit tests with Vitest
npx ng test
```

The default build configuration is **production**. Development mode disables optimisation and enables source maps.

---

## Coding conventions

- **Language** — all UI text, error messages, and variable-level comments are in **Dutch (nl)**.
- **Formatting** — Prettier with `printWidth: 100`, `singleQuote: true`. HTML files use the `angular` parser.
- **Component style** — standalone, inline template, inline SCSS styles (no separate `.html` / `.scss` files).
- **State** — use Angular signals (`signal()`, `computed()`) rather than RxJS subjects for component state.
- **Errors / feedback** — use `NotificationService` for all snackbar messages. Never use `alert()`.
- **Breakpoint** — `768px` is the single mobile breakpoint. Split portrait/landscape with `@media (max-width: 768px) and (orientation: portrait/landscape)` when the layout differs between orientations.
- **Touch targets** — all interactive elements must meet `min-height: 48px; min-width: 48px` (enforced globally).
- **Full-height PWA containers** — use `calc(100dvh - var(--navbar-height) - env(safe-area-inset-bottom))` instead of `100vh` to avoid clipping under the iOS home indicator.
- **Word validation** — words must match `/^[A-Z]{2,15}$/` (uppercase, 2–15 characters, letters only).
- **No boolean compound indexes** — Dexie / IndexedDB does not support booleans in compound key queries; use `.filter()` for `isDefault` instead of a compound `.where()` query.
