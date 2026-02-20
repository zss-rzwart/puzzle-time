import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'libraries',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/libraries/library-list/library-list.component').then(
        (m) => m.LibraryListComponent,
      ),
  },
  {
    path: 'libraries/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/libraries/library-detail/library-detail.component').then(
        (m) => m.LibraryDetailComponent,
      ),
  },
  {
    path: 'puzzle/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/puzzle-config/puzzle-config.component').then(
        (m) => m.PuzzleConfigComponent,
      ),
  },
  {
    path: 'puzzle/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/puzzle-config/puzzle-config.component').then(
        (m) => m.PuzzleConfigComponent,
      ),
  },
  {
    path: 'puzzle/definitions',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/puzzle-config/puzzle-definition-list/puzzle-definition-list.component'
      ).then((m) => m.PuzzleDefinitionListComponent),
  },
  {
    path: 'puzzle/play/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/puzzle-play/puzzle-play.component').then((m) => m.PuzzlePlayComponent),
  },
  {
    path: 'puzzle/play',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/puzzle-play/puzzle-play.component').then((m) => m.PuzzlePlayComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
