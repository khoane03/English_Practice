import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-answer-input',
  standalone: true,
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
  readonly id = input.required<string>();
  readonly question = input.required<string>();
  readonly value = model('');
  readonly disabled = input(false);

  updateValue(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.value.set(event.target.value);
    }
  }
}
