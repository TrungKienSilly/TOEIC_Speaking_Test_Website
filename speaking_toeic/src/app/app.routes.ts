import { Routes } from '@angular/router';

export const routes: Routes = [
  // Trang chủ
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },

  // Trang luyện phát âm từ data JSON
  {
    path: 'pronunciation-practice',
    loadComponent: () => import('./pronunciation-practice/pronunciation-practice.component').then(m => m.PronunciationPracticeComponent)
  },
];
