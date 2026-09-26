import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((module) => module.HomeComponent),
  },
  {
    path: 'practice/:mode',
    loadComponent: () =>
      import('./features/practice/practice.component').then((module) => module.PracticeComponent),
  },
  {
    path: 'questions',
    loadComponent: () =>
      import('./features/question-bank/question-bank.component').then(
        (module) => module.QuestionBankComponent,
      ),
  },
  {
    path: 'images',
    loadComponent: () =>
      import('./features/image-question-bank/image-question-bank.component').then(
        (module) => module.ImageQuestionBankComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
