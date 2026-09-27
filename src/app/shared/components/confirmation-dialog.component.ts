import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    <div class="dialog-backdrop" (click)="cancelled.emit()">
      <section
        class="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId()"
        [attr.aria-describedby]="messageId()"
        (click)="$event.stopPropagation()"
      >
        <span class="dialog-mark" aria-hidden="true">!</span>
        <h2 [id]="titleId()">{{ title() }}</h2>
        <p [id]="messageId()">{{ message() }}</p>
        <div class="dialog-actions">
          <button class="secondary-button" type="button" autofocus (click)="cancelled.emit()">Cancel</button>
          <button class="danger-button" type="button" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .dialog-backdrop {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgb(25 37 30 / 42%);
        animation: backdrop-in 130ms ease-out;
      }
      .confirmation-dialog {
        width: min(100%, 410px);
        padding: 25px;
        border: 1px solid #e7ebe5;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 18px 55px rgb(24 36 28 / 20%);
        animation: dialog-in 150ms ease-out;
      }
      .dialog-mark {
        display: grid;
        width: 35px;
        height: 35px;
        place-items: center;
        border-radius: 11px;
        background: #fbefed;
        color: #a44b3c;
        font-weight: 800;
      }
      h2 {
        margin: 16px 0 0;
        color: #33473c;
        font-size: 19px;
        letter-spacing: -0.025em;
      }
      p {
        margin: 8px 0 0;
        color: #748078;
        font-size: 13px;
        line-height: 1.65;
        overflow-wrap: anywhere;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        margin-top: 23px;
      }
      @keyframes backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes dialog-in {
        from { opacity: 0; transform: translateY(5px) scale(0.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .dialog-backdrop,
        .confirmation-dialog {
          animation: none;
        }
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Delete');
  readonly titleId = input('confirmation-dialog-title');
  readonly messageId = input('confirmation-dialog-message');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
