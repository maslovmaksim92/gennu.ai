import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, type TuiDialogContext, TuiInput } from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { injectContext } from '@taiga-ui/polymorpheus';
import { AdminInviteResult } from './admins.types';

@Component({
  imports: [FormsModule, TuiButton, TuiForm, TuiInput],
  templateUrl: './invite-admin-dialog.component.html',
})
export class InviteAdminDialogComponent {
  private readonly http = inject(HttpClient);

  protected readonly context = injectContext<TuiDialogContext<AdminInviteResult, void>>();
  protected email = '';
  protected creating = false;

  protected cancel(): void {
    this.context.$implicit.complete();
  }

  protected create(): void {
    if (this.creating || !this.email.trim()) {
      return;
    }

    this.creating = true;
    this.http
      .post<AdminInviteResult>('/api/admins/invite', { email: this.email.trim() })
      .subscribe({
        next: (result) => this.context.completeWith(result),
        error: () => {
          this.creating = false;
        },
      });
  }
}
