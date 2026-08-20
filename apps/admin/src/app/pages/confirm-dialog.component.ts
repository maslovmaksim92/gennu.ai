import { Component } from '@angular/core';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
}

@Component({
  imports: [TuiButton],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  protected readonly context = injectContext<TuiDialogContext<boolean, ConfirmDialogData>>();

  protected cancel(): void {
    this.context.completeWith(false);
  }

  protected confirm(): void {
    this.context.completeWith(true);
  }
}
