import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'loader',
    loadComponent: () => import('./loader/loader.page').then( m => m.LoaderPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then( m => m.HomePage)
  },
  {
    path: 'edit-workout',
    loadComponent: () => import('./edit-workout/edit-workout.page').then( m => m.EditWorkoutPage)
  },
  {
    path: 'create-workout',
    loadComponent: () => import('./create-workout/create-workout.page').then( m => m.CreateWorkoutPage)
  },
  {
    path: 'nutrition',
    loadComponent: () => import('./nutrition/nutrition.page').then( m => m.NutritionPage)
  },
  {
    path: 'edit-meal',
    loadComponent: () => import('./edit-meal/edit-meal.page').then( m => m.EditMealPage)
  },
  {
    path: 'create-meal',
    loadComponent: () => import('./create-meal/create-meal.page').then( m => m.CreateMealPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then( m => m.ProfilePage)
  },
];
