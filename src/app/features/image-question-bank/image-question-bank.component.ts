import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageExercise, ImageQuestion } from '../../core/models/practice.models';
import { CloudinaryUploadService } from '../../core/services/cloudinary-upload.service';
import { DataService } from '../../core/services/data.service';
import { JsonExportService } from '../../core/services/json-export.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog.component';
import { LanguageToolsComponent } from '../../shared/components/language-tools.component';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Component({
  selector: 'app-image-question-bank',
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent, LanguageToolsComponent],
  templateUrl: './image-question-bank.component.html',
  styleUrl: './image-question-bank.component.css',
})
export class ImageQuestionBankComponent {
  private readonly data = inject(DataService);
  private readonly exporter = inject(JsonExportService);
  private readonly cloudinary = inject(CloudinaryUploadService);

  readonly exercises = this.data.imageExercises;
  readonly uploadSettings = this.cloudinary.settings;
  readonly exerciseFormOpen = signal(false);
  readonly editingExerciseId = signal<string | null>(null);
  readonly questionFormExerciseId = signal<string | null>(null);
  readonly editingQuestionId = signal<string | null>(null);
  readonly notice = signal('');
  readonly confirmation = signal<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);
  readonly imageUrlError = signal('');
  readonly uploadError = signal('');
  readonly uploading = signal(false);
  readonly uploadedSelection = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly cloudNameText = signal(this.uploadSettings().cloudName);
  readonly uploadPresetText = signal(this.uploadSettings().uploadPreset);

  imageUrlText = '';
  titleText = '';
  newExerciseQuestions = [this.createQuestionDraft()];
  questionText = '';
  answerText = '';
  acceptedAnswersText = '';
  explanationText = '';

  openNewExercise(): void {
    this.resetExerciseForm();
    this.cloudNameText.set(this.uploadSettings().cloudName);
    this.uploadPresetText.set(this.uploadSettings().uploadPreset);
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
    this.uploadError.set('');
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

    const questions = this.newExerciseQuestions.map(({ question, answer }) => ({
      question: question.trim(),
      answer: answer.trim(),
    }));
    if (questions.some(({ question, answer }) => !question || !answer)) {
      this.notice.set('Complete every image question and answer, or remove the empty question row.');
      return;
    }
    const exerciseId = this.createExerciseId();
    const exercise: ImageExercise = {
      id: exerciseId,
      image,
      ...(this.titleText.trim() ? { title: this.titleText.trim() } : {}),
      questions: questions.map(({ question, answer }, index) => ({
        id: `${exerciseId}-q${index + 1}`,
        question,
        answer,
      })),
    };
    this.data.saveImageExercises([exercise, ...this.exercises()]);
    this.closeExerciseForm();
    this.notice.set('Image exercise added.');
  }

  saveUploadSettings(): void {
    try {
      this.cloudinary.saveSettings({
        cloudName: this.cloudNameText(),
        uploadPreset: this.uploadPresetText(),
      });
      this.notice.set('Cloudinary upload settings saved in this browser.');
      this.uploadError.set('');
    } catch (error) {
      this.uploadError.set(
        error instanceof Error ? error.message : 'Could not save Cloudinary settings.',
      );
    }
  }

  selectImage(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.uploadError.set('');
    this.uploadedSelection.set(false);
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  async uploadSelectedImage(): Promise<void> {
    const file = this.selectedFile();
    if (!file || this.uploading() || this.uploadedSelection()) {
      return;
    }
    this.uploading.set(true);
    this.uploadError.set('');
    try {
      this.imageUrlText = await this.cloudinary.upload(file);
      this.imageUrlError.set('');
      this.uploadedSelection.set(true);
      this.notice.set('Image uploaded. Finish the exercise details and save it.');
    } catch (error) {
      this.uploadError.set(
        error instanceof Error ? error.message : 'The image could not be uploaded.',
      );
    } finally {
      this.uploading.set(false);
    }
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

  deleteImageQuestion(exercise: ImageExercise, question: ImageQuestion): void {
    if (exercise.questions.length <= 1) {
      this.notice.set('An image exercise must keep at least one question.');
      return;
    }
    this.confirmation.set({
      title: 'Delete this question?',
      message: `"${question.question}" will be permanently removed from this image exercise.`,
      confirmLabel: 'Delete question',
      action: () => {
        this.data.saveImageExercises(
          this.exercises().map((item) =>
            item.id === exercise.id
              ? { ...item, questions: item.questions.filter((entry) => entry.id !== question.id) }
              : item,
          ),
        );
        if (this.editingQuestionId() === question.id) {
          this.closeQuestionForm();
        }
        this.notice.set('Image question deleted.');
      },
    });
  }

  deleteExercise(exercise: ImageExercise): void {
    const label = exercise.title || exercise.id;
    this.confirmation.set({
      title: 'Delete this image exercise?',
      message: `"${label}" and all ${exercise.questions.length} associated ${exercise.questions.length === 1 ? 'question' : 'questions'} will be permanently removed.`,
      confirmLabel: 'Delete image',
      action: () => {
        this.data.saveImageExercises(
          this.exercises().filter((item) => item.id !== exercise.id),
        );
        if (this.questionFormExerciseId() === exercise.id) {
          this.closeQuestionForm();
        }
        if (this.editingExerciseId() === exercise.id) {
          this.closeExerciseForm();
        }
        this.notice.set(`Image exercise "${label}" and its questions were deleted.`);
      },
    });
  }

  addExerciseQuestionDraft(): void {
    this.newExerciseQuestions.push(this.createQuestionDraft());
  }

  removeExerciseQuestionDraft(index: number): void {
    if (this.newExerciseQuestions.length <= 1) {
      this.notice.set('An image exercise needs at least one question and answer.');
      return;
    }
    this.confirmation.set({
      title: 'Remove this question row?',
      message: `Question ${index + 1} and its current answer will be removed from this unsaved exercise.`,
      confirmLabel: 'Remove row',
      action: () => {
        this.newExerciseQuestions.splice(index, 1);
      },
    });
  }

  confirmPendingAction(): void {
    const request = this.confirmation();
    this.confirmation.set(null);
    request?.action();
  }

  cancelPendingAction(): void {
    this.confirmation.set(null);
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

  async importExercises(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    try {
      const imported = this.validateExercises(JSON.parse(await file.text()) as unknown);
      if (!window.confirm(`Replace all ${this.exercises().length} current image exercises with ${imported.length} imported exercises?`)) {
        return;
      }
      this.data.saveImageExercises(imported);
      this.notice.set(`Imported ${imported.length} image exercises. Your previous list was replaced.`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'Could not import the image exercises JSON file.');
    }
  }

  private validateExercises(value: unknown): ImageExercise[] {
    if (!Array.isArray(value)) {
      throw new Error('Invalid image exercises file: expected a JSON array exported from the image question bank.');
    }

    const exerciseIds = new Set<string>();
    const questionIds = new Set<string>();
    return value.map((entry, index) => {
      const row = index + 1;
      if (
        !isRecord(entry) ||
        typeof entry['id'] !== 'string' ||
        !entry['id'].trim() ||
        typeof entry['image'] !== 'string' ||
        !this.isCloudinaryUrl(entry['image']) ||
        !Array.isArray(entry['questions']) ||
        entry['questions'].length === 0 ||
        (entry['title'] !== undefined && typeof entry['title'] !== 'string')
      ) {
        throw new Error(`Invalid image exercise at row ${row}: check its ID, Cloudinary URL, title, and questions.`);
      }
      if (exerciseIds.has(entry['id'])) {
        throw new Error(`Invalid image exercises file: duplicate exercise ID "${entry['id']}".`);
      }
      exerciseIds.add(entry['id']);

      const questions = entry['questions'].map((question, questionIndex): ImageQuestion => {
        if (
          !isRecord(question) ||
          typeof question['id'] !== 'string' ||
          !question['id'].trim() ||
          typeof question['question'] !== 'string' ||
          !question['question'].trim() ||
          typeof question['answer'] !== 'string' ||
          !question['answer'].trim()
        ) {
          throw new Error(`Invalid question ${questionIndex + 1} in image exercise row ${row}.`);
        }
        if (questionIds.has(question['id'])) {
          throw new Error(`Invalid image exercises file: duplicate question ID "${question['id']}".`);
        }
        questionIds.add(question['id']);
        if (
          (question['acceptedAnswers'] !== undefined &&
            (!Array.isArray(question['acceptedAnswers']) ||
              question['acceptedAnswers'].some((answer) => typeof answer !== 'string'))) ||
          (question['explanation'] !== undefined && typeof question['explanation'] !== 'string')
        ) {
          throw new Error(`Invalid question ${questionIndex + 1} in image exercise row ${row}: optional fields have an unexpected format.`);
        }

        return {
          id: question['id'],
          question: question['question'],
          answer: question['answer'],
          ...(question['acceptedAnswers']
            ? { acceptedAnswers: question['acceptedAnswers'] as string[] }
            : {}),
          ...(typeof question['explanation'] === 'string'
            ? { explanation: question['explanation'] }
            : {}),
        };
      });

      return {
        id: entry['id'],
        image: entry['image'],
        ...(typeof entry['title'] === 'string' ? { title: entry['title'] } : {}),
        questions,
      };
    });
  }

  isCloudinaryUrl(value: string): boolean {
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
    this.newExerciseQuestions = [this.createQuestionDraft()];
    this.imageUrlError.set('');
    this.uploadError.set('');
    this.uploadedSelection.set(false);
    this.selectedFile.set(null);
  }

  private resetQuestionForm(): void {
    this.questionText = '';
    this.answerText = '';
    this.acceptedAnswersText = '';
    this.explanationText = '';
  }

  private createQuestionDraft(): { question: string; answer: string } {
    return { question: '', answer: '' };
  }
}
