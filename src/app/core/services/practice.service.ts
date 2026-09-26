import { Injectable } from '@angular/core';
import { AnswerReview, ImageExercise, PracticeItem, Question } from '../models/practice.models';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  createMixedTest(questions: Question[], exercises: ImageExercise[]): PracticeItem[] {
    if (exercises.length === 0) {
      return [];
    }

    const textItems: PracticeItem[] = this.shuffle(questions)
      .slice(0, 5)
      .map((question) => ({
        ...question,
        source: 'text',
      }));
    const exercise = this.shuffle(exercises)[0];
    const imageItems = exercise.questions.map((question) => ({
      ...question,
      image: exercise.image,
      imageTitle: exercise.title,
      source: 'image' as const,
    }));

    return this.shuffle([...textItems, ...imageItems]);
  }

  createFullTest(questions: Question[]): PracticeItem[] {
    return this.shuffle(questions).map((question) => ({ ...question, source: 'text' }));
  }

  evaluate(items: PracticeItem[], answers: Record<string, string>): AnswerReview[] {
    return items.map((item) => {
      const accepted = [item.answer, ...(item.acceptedAnswers ?? [])];
      const answer = this.normalize(answers[item.id] ?? '');
      return {
        ...item,
        userAnswer: answers[item.id] ?? '',
        correct: accepted.some((candidate) => this.normalize(candidate) === answer),
      };
    });
  }

  private normalize(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
}
