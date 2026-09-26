import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { JsonExportService } from '../../core/services/json-export.service';
import { Question } from '../../core/models/practice.models';

@Component({
  selector: 'app-question-bank',
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank.component.html',
  styleUrl: './question-bank.component.css',
})
export class QuestionBankComponent {
  private readonly data = inject(DataService);
  private readonly exporter = inject(JsonExportService);

  readonly search = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly notice = signal('');
  readonly questions = this.data.questions;
  readonly filteredQuestions = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) {
      return this.questions();
    }
    return this.questions().filter((question) =>
      [question.question, question.answer, ...(question.acceptedAnswers ?? [])]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    );
  });

  questionText = '';
  answerText = '';
  acceptedAnswersText = '';
  explanationText = '';
  categoryText = '';
  levelText = '';

  openNewQuestion(): void {
    this.resetForm();
    this.formOpen.set(true);
    this.editingId.set(null);
  }

  editQuestion(question: Question): void {
    this.questionText = question.question;
    this.answerText = question.answer;
    this.acceptedAnswersText = (question.acceptedAnswers ?? []).join('\n');
    this.explanationText = question.explanation ?? '';
    this.categoryText = question.category ?? '';
    this.levelText = question.level ?? '';
    this.editingId.set(question.id);
    this.formOpen.set(true);
    this.notice.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  saveQuestion(): void {
    const question = this.questionText.trim();
    const answer = this.answerText.trim();
    if (!question || !answer) {
      this.notice.set('Enter both a question and an answer before saving.');
      return;
    }

    const acceptedAnswers = this.acceptedAnswersText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const existing = this.editingId();
    const record: Question = {
      id: existing ?? this.createId(),
      question,
      answer,
      ...(acceptedAnswers.length ? { acceptedAnswers } : {}),
      ...(this.explanationText.trim() ? { explanation: this.explanationText.trim() } : {}),
      ...(this.categoryText.trim() ? { category: this.categoryText.trim() } : {}),
      ...(this.levelText.trim() ? { level: this.levelText.trim() } : {}),
    };
    const records = [...this.questions()];
    const index = records.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    this.data.saveQuestions(records);
    this.closeForm();
    this.notice.set(existing ? 'Question updated.' : 'Question added.');
  }

  exportQuestions(): void {
    this.exporter.download('questions.json', this.questions());
  }

  private createId(): string {
    const ids = new Set(this.questions().map((question) => question.id));
    let next = this.questions().length + 1;
    while (ids.has(`q${String(next).padStart(3, '0')}`)) {
      next += 1;
    }
    return `q${String(next).padStart(3, '0')}`;
  }

  private resetForm(): void {
    this.questionText = '';
    this.answerText = '';
    this.acceptedAnswersText = '';
    this.explanationText = '';
    this.categoryText = '';
    this.levelText = '';
  }
}
