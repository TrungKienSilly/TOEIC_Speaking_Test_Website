import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'speaking-practice',
    loadComponent: () => import('./speaking-practice/speaking-practice.component').then(m => m.SpeakingPracticeComponent)
  },
  {
    path: 'speaking-practice/:topic',
    loadComponent: () => import('./speaking-practice/speaking-practice.component').then(m => m.SpeakingPracticeComponent)
  },
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  }
];
