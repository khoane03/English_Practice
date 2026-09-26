import { Injectable, signal } from '@angular/core';
import initialQuestions from '../../../assets/data/questions.json';
import initialImageExercises from '../../../assets/data/image-exercises.json';
import { ImageExercise, Question } from '../models/practice.models';

const QUESTION_STORAGE_KEY = 'english-practice.questions.v1';
const IMAGE_STORAGE_KEY = 'english-practice.image-exercises.v1';

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly questions = signal<Question[]>(this.readStored(QUESTION_STORAGE_KEY, initialQuestions));
  readonly imageExercises = signal<ImageExercise[]>(
    this.readStored(IMAGE_STORAGE_KEY, initialImageExercises),
  );

  saveQuestions(questions: Question[]): void {
    this.questions.set(questions);
    this.persist(QUESTION_STORAGE_KEY, questions);
  }

  saveImageExercises(exercises: ImageExercise[]): void {
    this.imageExercises.set(exercises);
    this.persist(IMAGE_STORAGE_KEY, exercises);
  }

  resetLocalData(): void {
    localStorage.removeItem(QUESTION_STORAGE_KEY);
    localStorage.removeItem(IMAGE_STORAGE_KEY);
    this.questions.set(initialQuestions);
    this.imageExercises.set(initialImageExercises);
  }

  private readStored<T>(key: string, fallback: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    try {
      return JSON.parse(stored) as T;
    } catch (error) {
      console.error(`Saved English practice data could not be read (${key}).`, error);
      return fallback;
    }
  }

  private persist<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
}
