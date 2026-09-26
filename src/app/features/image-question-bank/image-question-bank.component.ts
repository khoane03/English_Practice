import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageExercise, ImageQuestion } from '../../core/models/practice.models';
import { DataService } from '../../core/services/data.service';
import { JsonExportService } from '../../core/services/json-export.service';

@Component({
  selector: 'app-image-question-bank',
  imports: [CommonModule, FormsModule],
  templateUrl: './image-question-bank.component.html',
  styleUrl: './image-question-bank.component.css',
})
export class ImageQuestionBankComponent {
  private readonly data = inject(DataService);
  private readonly exporter = inject(JsonExportService);

  readonly exercises = this.data.imageExercises;
  readonly exerciseFormOpen = signal(false);
  readonly editingExerciseId = signal<string | null>(null);
  readonly questionFormExerciseId = signal<string | null>(null);
  readonly editingQuestionId = signal<string | null>(null);
  readonly notice = signal('');
  readonly imageUrlError = signal('');

  imageUrlText = '';
  titleText = '';
  firstQuestionText = '';
  firstAnswerText = '';
  questionText = '';
  answerText = '';
  acceptedAnswersText = '';
  explanationText = '';

  openNewExercise(): void {
    this.resetExerciseForm();
    this.editingExerciseId.set(null);
    this.exerciseFormOpen.set(true);
    this.questionFormExerciseId.set(null);
    this.notice.set('');
  }

  editExercise(exercise: ImageExercise): void {
    this.imageUrlText = exercise.image;
    this.titleText = exercise.title ?? '';
    this.editingExerciseId.set(exercise.id);
    this.exerciseFormOpen.set(true);
    this.questionFormExerciseId.set(null);
    this.imageUrlError.set('');
    this.notice.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveExercise(): void {
    const image = this.imageUrlText.trim();
    if (!this.isCloudinaryUrl(image)) {
      this.imageUrlError.set('Use a valid HTTPS image URL hosted on res.cloudinary.com.');
      return;
    }
    this.imageUrlError.set('');
    const id = this.editingExerciseId();
    if (id) {
      const records = this.exercises().map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              image,
              ...(this.titleText.trim() ? { title: this.titleText.trim() } : { title: undefined }),
            }
          : exercise,
      );
      this.data.saveImageExercises(records);
      this.closeExerciseForm();
      this.notice.set('Image exercise updated.');
      return;
    }

    const firstQuestion = this.firstQuestionText.trim();
    const firstAnswer = this.firstAnswerText.trim();
    if (!firstQuestion || !firstAnswer) {
      this.notice.set('Add the first image question and answer before saving the exercise.');
      return;
    }
    const exerciseId = this.createExerciseId();
    const exercise: ImageExercise = {
      id: exerciseId,
      image,
      ...(this.titleText.trim() ? { title: this.titleText.trim() } : {}),
      questions: [
        {
          id: `${exerciseId}-q1`,
          question: firstQuestion,
          answer: firstAnswer,
        },
      ],
    };
    this.data.saveImageExercises([exercise, ...this.exercises()]);
    this.closeExerciseForm();
    this.notice.set('Image exercise added.');
  }

  openNewQuestion(exercise: ImageExercise): void {
    this.resetQuestionForm();
    this.questionFormExerciseId.set(exercise.id);
    this.editingQuestionId.set(null);
    this.exerciseFormOpen.set(false);
    this.notice.set('');
  }

  editQuestion(exercise: ImageExercise, question: ImageQuestion): void {
    this.questionText = question.question;
    this.answerText = question.answer;
    this.acceptedAnswersText = (question.acceptedAnswers ?? []).join('\n');
    this.explanationText = question.explanation ?? '';
    this.questionFormExerciseId.set(exercise.id);
    this.editingQuestionId.set(question.id);
    this.exerciseFormOpen.set(false);
    this.notice.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveImageQuestion(): void {
    const exerciseId = this.questionFormExerciseId();
    const isEditing = this.editingQuestionId() !== null;
    const question = this.questionText.trim();
    const answer = this.answerText.trim();
    if (!exerciseId || !question || !answer) {
      this.notice.set('Enter both an image question and an answer before saving.');
      return;
    }
    const acceptedAnswers = this.acceptedAnswersText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    this.data.saveImageExercises(
      this.exercises().map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }
        const existingId = this.editingQuestionId();
        const record: ImageQuestion = {
          id: existingId ?? this.createQuestionId(exercise),
          question,
          answer,
          ...(acceptedAnswers.length ? { acceptedAnswers } : {}),
          ...(this.explanationText.trim() ? { explanation: this.explanationText.trim() } : {}),
        };
        const index = exercise.questions.findIndex((item) => item.id === record.id);
        const questions = [...exercise.questions];
        if (index >= 0) {
          questions[index] = record;
        } else {
          questions.push(record);
        }
        return { ...exercise, questions };
      }),
    );
    this.closeQuestionForm();
    this.notice.set(isEditing ? 'Image question updated.' : 'Image question added.');
  }

  closeExerciseForm(): void {
    this.exerciseFormOpen.set(false);
    this.editingExerciseId.set(null);
    this.resetExerciseForm();
  }

  closeQuestionForm(): void {
    this.questionFormExerciseId.set(null);
    this.editingQuestionId.set(null);
    this.resetQuestionForm();
  }

  exportExercises(): void {
    this.exporter.download('image-exercises.json', this.exercises());
  }

  private isCloudinaryUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        /^\/[^/]+\/image\/upload\/.+/.test(url.pathname)
      );
    } catch {
      return false;
    }
  }

  private createExerciseId(): string {
    const ids = new Set(this.exercises().map((exercise) => exercise.id));
    let next = this.exercises().length + 1;
    while (ids.has(`img${String(next).padStart(3, '0')}`)) {
      next += 1;
    }
    return `img${String(next).padStart(3, '0')}`;
  }

  private createQuestionId(exercise: ImageExercise): string {
    const ids = new Set(exercise.questions.map((question) => question.id));
    let next = exercise.questions.length + 1;
    while (ids.has(`${exercise.id}-q${next}`)) {
      next += 1;
    }
    return `${exercise.id}-q${next}`;
  }

  private resetExerciseForm(): void {
    this.imageUrlText = '';
    this.titleText = '';
    this.firstQuestionText = '';
    this.firstAnswerText = '';
    this.imageUrlError.set('');
  }

  private resetQuestionForm(): void {
    this.questionText = '';
    this.answerText = '';
    this.acceptedAnswersText = '';
    this.explanationText = '';
  }
}
