import { Routes } from '@angular/router';

export const routes: Routes = [
  // Trang chủ
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },

  // Trang luyện tập chung (cho tương thích ngược)
  {
    path: 'speaking-practice',
    loadComponent: () => import('./speaking-practice/speaking-practice.component').then(m => m.SpeakingPracticeComponent)
  },
  {
    path: 'speaking-practice/:topic',
    loadComponent: () => import('./speaking-practice/speaking-practice.component').then(m => m.SpeakingPracticeComponent)
  },

  // Các trang topic riêng biệt
  {
    path: 'school',
    loadComponent: () => import('./school-topic/school-topic.component').then(m => m.SchoolTopicComponent)
  },
  {
    path: 'hobby',
    loadComponent: () => import('./hobby-topic/hobby-topic.component').then(m => m.HobbyTopicComponent)
  },
  {
    path: 'food',
    loadComponent: () => import('./food-topic/food-topic.component').then(m => m.FoodTopicComponent)
  },
  {
    path: 'shopping',
    loadComponent: () => import('./shopping-topic/shopping-topic.component').then(m => m.ShoppingTopicComponent)
  },
  {
    path: 'environment',
    loadComponent: () => import('./environment-topic/environment-topic.component').then(m => m.EnvironmentTopicComponent)
  },
  {
    path: 'work',
    loadComponent: () => import('./work-topic/work-topic.component').then(m => m.WorkTopicComponent)
  }
];
