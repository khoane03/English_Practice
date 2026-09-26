import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AnswerReview, PracticeItem } from '../../core/models/practice.models';
import { DataService } from '../../core/services/data.service';
import { PracticeService } from '../../core/services/practice.service';
import { AnswerInputComponent } from '../../shared/components/answer-input.component';

@Component({
  selector: 'app-practice',
  imports: [CommonModule, RouterLink, AnswerInputComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css',
})
export class PracticeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject(DataService);
  private readonly practice = inject(PracticeService);

  readonly mode = signal<'mixed' | 'full'>('mixed');
  readonly items = signal<PracticeItem[]>([]);
  readonly answers = signal<Record<string, string>>({});
  readonly result = signal<AnswerReview[] | null>(null);
  readonly textItems = computed(() => this.items().filter((item) => item.source === 'text'));
  readonly imageItems = computed(() => this.items().filter((item) => item.source === 'image'));
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
    this.answers.set({});
    this.items.set(
      this.mode() === 'full'
        ? this.practice.createFullTest(this.data.questions())
        : this.practice.createMixedTest(this.data.questions(), this.data.imageExercises()),
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

  isFirstImageItem(index: number): boolean {
    return this.imageItems()[0]?.id === this.items()[index]?.id;
  }

  resultFor(id: string): AnswerReview | undefined {
    return this.result()?.find((answer) => answer.id === id);
  }
}
