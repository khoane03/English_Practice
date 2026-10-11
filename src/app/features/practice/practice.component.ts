import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AnswerReview, PracticeItem } from '../../core/models/practice.models';
import { AnswerSuggestionService } from '../../core/services/answer-suggestion.service';
import { DataService } from '../../core/services/data.service';
import { PracticeService } from '../../core/services/practice.service';
import { AnswerInputComponent } from '../../shared/components/answer-input.component';
import { LanguageToolsComponent } from '../../shared/components/language-tools.component';

interface ImageQuestionGroup {
  id: string;
  image: string;
  title: string;
  items: PracticeItem[];
}

interface FullTestStep {
  id: string;
  items: PracticeItem[];
  source: PracticeItem['source'];
}

@Component({
  selector: 'app-practice',
  imports: [CommonModule, FormsModule, RouterLink, AnswerInputComponent, LanguageToolsComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css',
})
export class PracticeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject(DataService);
  readonly answerSuggestions = inject(AnswerSuggestionService);
  private readonly practice = inject(PracticeService);
  readonly apiKeyDraft = signal(this.answerSuggestions.apiKey());
  readonly apiKeyNotice = signal('');

  readonly mode = signal<'mixed' | 'full'>('mixed');
  readonly items = signal<PracticeItem[]>([]);
  readonly currentIndex = signal(0);
  readonly revealedQuestions = signal<Record<string, boolean>>({});
  readonly answers = signal<Record<string, string>>({});
  readonly result = signal<AnswerReview[] | null>(null);
  readonly fullTestSteps = computed<FullTestStep[]>(() => {
    const steps = new Map<string, FullTestStep>();
    for (const item of this.items()) {
      const id = item.source === 'image' ? `image:${item.imageExerciseId ?? item.id}` : `text:${item.id}`;
      const step = steps.get(id);
      if (step) {
        step.items.push(item);
      } else {
        steps.set(id, { id, items: [item], source: item.source });
      }
    }
    return [...steps.values()];
  });
  readonly currentStep = computed(() => this.fullTestSteps()[this.currentIndex()]);
  readonly fullTestProgress = computed(() =>
    this.fullTestSteps().length
      ? ((this.currentIndex() + 1) / this.fullTestSteps().length) * 100
      : 0,
  );
  readonly textItems = computed(() => this.items().filter((item) => item.source === 'text'));
  readonly imageItems = computed(() => this.items().filter((item) => item.source === 'image'));
  readonly imageGroups = computed(() => {
    const groups = new Map<string, ImageQuestionGroup>();
    for (const item of this.imageItems()) {
      const id = item.imageExerciseId ?? item.image ?? item.id;
      const group = groups.get(id);
      if (group) {
        group.items.push(item);
      } else {
        groups.set(id, {
          id,
          image: item.image ?? '',
          title: item.imageTitle || 'Picture practice',
          items: [item],
        });
      }
    }
    return [...groups.values()];
  });
  readonly score = computed(() => this.result()?.filter((answer) => answer.correct).length ?? 0);
  readonly accuracy = computed(() => {
    const total = this.result()?.length ?? 0;
    return total ? Math.round((this.score() / total) * 100) : 0;
  });
  readonly title = computed(() => (this.mode() === 'mixed' ? 'Mixed test' : 'Full test'));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.mode.set(params.get('mode') === 'full' ? 'full' : 'mixed');
      this.start();
    });
  }

  start(): void {
    this.result.set(null);
    this.currentIndex.set(0);
    this.revealedQuestions.set({});
    this.answers.set({});
    this.items.set(
      this.mode() === 'full'
        ? this.practice.createFullTest(this.data.questions(), this.data.imageExercises())
        : this.practice.createMixedTest(this.data.questions(), this.data.imageExercises()),
    );
  }

  saveGroqApiKey(): void {
    this.answerSuggestions.saveApiKey(this.apiKeyDraft());
    this.apiKeyDraft.set(this.answerSuggestions.apiKey());
    this.apiKeyNotice.set(
      this.answerSuggestions.apiKey()
        ? 'Groq API key saved in this browser.'
        : 'Groq API key removed.',
    );
  }

  setAnswer(id: string, value: string): void {
    this.answers.update((answers) => ({ ...answers, [id]: value }));
  }

  answerFor(id: string): string {
    return this.answers()[id] ?? '';
  }

  submit(): void {
    this.result.set(this.practice.evaluate(this.items(), this.answers()));
  }

  finishCurrentQuestion(): void {
    if (this.currentIndex() === this.fullTestSteps().length - 1) {
      this.submit();
      return;
    }

    this.currentIndex.update((index) => index + 1);
    this.revealedQuestions.set({});
  }

  questionIsRevealed(id: string): boolean {
    return this.revealedQuestions()[id] ?? false;
  }

  toggleQuestionReveal(id: string): void {
    this.revealedQuestions.update((revealed) => ({
      ...revealed,
      [id]: !revealed[id],
    }));
  }

  isFirstImageItem(index: number): boolean {
    return this.imageItems()[0]?.id === this.items()[index]?.id;
  }

  resultFor(id: string): AnswerReview | undefined {
    return this.result()?.find((answer) => answer.id === id);
  }
}
