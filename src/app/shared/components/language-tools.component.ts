import { Component, input, signal } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-language-tools',
  standalone: true,
  template: `
    <div class="language-tools">
      <div class="tool-buttons">
        <button
          class="tool-button"
          type="button"
          [disabled]="!text().trim()"
          [attr.aria-label]="'Read ' + label() + ' aloud in English'"
          (click)="readAloud()"
        >
          <span aria-hidden="true">◖</span> Read aloud
        </button>
        <button
          class="tool-button"
          type="button"
          [disabled]="!text().trim() || translating()"
          [attr.aria-expanded]="showTranslation()"
          (click)="toggleTranslation()"
        >
          @if (translating()) {
            <span class="mini-spinner" aria-hidden="true"></span> Translating…
          } @else if (showTranslation()) {
            Hide translation
          } @else {
            <span aria-hidden="true">文</span> Dịch tiếng Việt
          }
        </button>
      </div>
      @if (speechError()) {
        <p class="tool-error" role="status">{{ speechError() }}</p>
      }
      @if (translationError()) {
        <p class="tool-error" role="alert">{{ translationError() }}</p>
      }
      @if (showTranslation() && translation()) {
        <p class="translation" lang="vi" aria-live="polite">
          <span>Bản dịch tham khảo</span>
          {{ translation() }}
        </p>
      }
    </div>
  `,
  styles: [
    `
      .language-tools {
        display: grid;
        gap: 6px;
        margin-top: 7px;
      }
      .tool-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 10px;
      }
      .tool-button {
        display: inline-flex;
        min-height: 28px;
        align-items: center;
        gap: 5px;
        padding: 3px 5px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #57715f;
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        font-weight: 650;
      }
      .tool-button:hover:not(:disabled) {
        background: #eff4ee;
        color: #385844;
      }
      .tool-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .translation {
        margin: 0;
        padding: 8px 10px;
        border-left: 2px solid #9bad9a;
        border-radius: 0 6px 6px 0;
        background: #f5f8f3;
        color: #526158;
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }
      .translation span {
        display: block;
        margin-bottom: 2px;
        color: #89958c;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .tool-error {
        margin: 0;
        color: #a44b3c;
        font-size: 10px;
        line-height: 1.5;
      }
      .mini-spinner {
        width: 11px;
        height: 11px;
        border: 1.5px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 650ms linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .mini-spinner { animation-duration: 1600ms; }
      }
    `,
  ],
})
export class LanguageToolsComponent {
  readonly text = input.required<string>();
  readonly label = input('text');
  readonly translating = signal(false);
  readonly showTranslation = signal(false);
  readonly translation = signal('');
  readonly translationError = signal('');
  readonly speechError = signal('');

  constructor(private readonly translationService: TranslationService) {}

  async toggleTranslation(): Promise<void> {
    if (this.showTranslation()) {
      this.showTranslation.set(false);
      return;
    }
    if (this.translation()) {
      this.showTranslation.set(true);
      return;
    }

    this.translationError.set('');
    this.translating.set(true);
    try {
      this.translation.set(
        await this.translationService.translateEnglishToVietnamese(this.text()),
      );
      this.showTranslation.set(true);
    } catch (error) {
      this.translationError.set(
        error instanceof Error ? error.message : 'Could not translate this text.',
      );
    } finally {
      this.translating.set(false);
    }
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      return null;
    }

    const preferredNames = [
      'samantha',
      'susan',
      'zira',
      'aria',
      'victoria',
      'female',
      'woman',
      'girl',
      'google uk english female',
      'google us english female',
      'google english female',
    ];

    const preferredVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      const female = /female|woman|girl|samantha|susan|zira|aria|victoria|voice2/.test(name);
      return (lang.includes('en') || lang.startsWith('en')) && female;
    });

    if (preferredVoice) {
      return preferredVoice;
    }

    const fallbackVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return preferredNames.some((preferred) => name.includes(preferred));
    });

    return fallbackVoice ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? null;
  }

  readAloud(): void {
    this.speechError.set('');
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      this.speechError.set('This browser does not support reading text aloud.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(this.text());
    const preferredVoice = this.getPreferredVoice();
    utterance.lang = 'en-US';
    utterance.voice = preferredVoice ?? null;
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    utterance.volume = 1;
    utterance.onerror = () => {
      this.speechError.set('Could not read the text aloud. Check your browser audio settings.');
    };
    window.speechSynthesis.speak(utterance);
  }
}
