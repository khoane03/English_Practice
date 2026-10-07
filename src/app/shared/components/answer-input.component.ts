import { Component, inject, input, model, signal } from '@angular/core';
import { AnswerSuggestionService } from '../../core/services/answer-suggestion.service';
import { LanguageToolsComponent } from './language-tools.component';

@Component({
  selector: 'app-answer-input',
  standalone: true,
  imports: [LanguageToolsComponent],
  template: `
    <label class="answer-label" [for]="id()">Your answer</label>
    <textarea
      [id]="id()"
      [value]="value()"
      (input)="updateValue($event)"
      [disabled]="disabled()"
      [attr.aria-label]="'Your answer for ' + question()"
      placeholder="Write your answer here..."
      rows="2"
    ></textarea>
    <div class="suggestion-actions">
      <button
        class="suggestion-button"
        type="button"
        [disabled]="!suggestions.apiKey() || loadingSuggestion() || loadingStructure()"
        (click)="suggestAnswer()"
      >
        @if (loadingSuggestion()) {
          Generating…
        } @else {
          Suggest a different answer
        }
      </button>
      <button
        class="suggestion-button structure-button"
        type="button"
        [disabled]="!suggestions.apiKey() || loadingSuggestion() || loadingStructure()"
        (click)="suggestStructure()"
      >
        @if (loadingStructure()) {
          Preparing guide…
        } @else {
          How should I structure it?
        }
      </button>
      @if (!suggestions.apiKey()) {
        <span class="suggestion-hint">Add a Groq API key above to enable suggestions.</span>
      }
    </div>
    @if (suggestion()) {
      <div class="suggestion-result" aria-live="polite">
        <p>{{ suggestion() }}</p>
        <button class="suggestion-button" type="button" (click)="useSuggestion()">Use this answer</button>
      </div>
    }
    @if (suggestionError()) {
      <p class="suggestion-error" role="alert">{{ suggestionError() }}</p>
    }
    @if (answerStructure()) {
      <div class="suggestion-result structure-result" aria-live="polite">
        <p>{{ answerStructure() }}</p>
      </div>
    }
    @if (structureError()) {
      <p class="suggestion-error" role="alert">{{ structureError() }}</p>
    }
    <app-language-tools [text]="value()" label="answer" />
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 7px;
      }
      .answer-label {
        color: #758078;
        font-size: 11px;
        font-weight: 650;
      }
      .suggestion-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .suggestion-button {
        width: fit-content;
        padding: 5px 8px;
        border: 1px solid #dfe5df;
        border-radius: 6px;
        background: #f7f9f6;
        color: #57715f;
        cursor: pointer;
        font: inherit;
        font-size: 11px;
        font-weight: 650;
      }
      .suggestion-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .structure-button {
        border-color: #dce7db;
        background: #f0f5ef;
      }
      .suggestion-hint,
      .suggestion-error {
        color: #87928b;
        font-size: 10px;
      }
      .suggestion-error {
        margin: 0;
        color: #a44b3c;
      }
      .suggestion-result {
        display: grid;
        gap: 6px;
        padding: 9px 11px;
        border-radius: 7px;
        background: #f1f5ef;
        color: #3d5144;
        font-size: 13px;
        line-height: 1.55;
      }
      .suggestion-result p {
        margin: 0;
        white-space: pre-wrap;
      }
      .structure-result {
        border-left: 3px solid #8ca995;
      }
      textarea {
        width: 100%;
        min-height: 74px;
        padding: 11px 12px;
        resize: vertical;
        border: 1px solid #dfe5df;
        border-radius: 8px;
        background: #fff;
        color: #293a32;
        font: inherit;
        font-size: 14px;
        line-height: 1.55;
      }
      textarea:focus {
        border-color: #8ca995;
        outline: 3px solid rgb(140 169 149 / 15%);
      }
      textarea:disabled {
        background: #f8f9f7;
      }
    `,
  ],
})
export class AnswerInputComponent {
  readonly suggestions = inject(AnswerSuggestionService);
  readonly id = input.required<string>();
  readonly question = input.required<string>();
  readonly referenceAnswer = input('');
  readonly imageUrl = input('');
  readonly value = model('');
  readonly disabled = input(false);
  readonly loadingSuggestion = signal(false);
  readonly suggestion = signal('');
  readonly suggestionError = signal('');
  readonly loadingStructure = signal(false);
  readonly answerStructure = signal('');
  readonly structureError = signal('');

  async suggestAnswer(): Promise<void> {
    this.loadingSuggestion.set(true);
    this.suggestionError.set('');
    this.suggestion.set('');
    this.structureError.set('');
    try {
      this.suggestion.set(
        await this.suggestions.suggestAnswer(
          this.question(),
          this.referenceAnswer(),
          this.imageUrl() || undefined,
        ),
      );
    } catch (error) {
      this.suggestionError.set(
        error instanceof Error ? error.message : 'Could not generate a suggested answer.',
      );
    } finally {
      this.loadingSuggestion.set(false);
    }
  }

  async suggestStructure(): Promise<void> {
    this.loadingStructure.set(true);
    this.structureError.set('');
    this.answerStructure.set('');
    this.suggestionError.set('');
    try {
      this.answerStructure.set(
        await this.suggestions.suggestAnswerStructure(
          this.question(),
          this.referenceAnswer(),
          this.imageUrl() || undefined,
        ),
      );
    } catch (error) {
      this.structureError.set(
        error instanceof Error ? error.message : 'Could not generate an answer structure guide.',
      );
    } finally {
      this.loadingStructure.set(false);
    }
  }

  updateValue(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.value.set(event.target.value);
    }
  }

  useSuggestion(): void {
    this.value.set(this.suggestion());
  }
}
