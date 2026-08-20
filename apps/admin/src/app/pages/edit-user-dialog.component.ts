import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, type TuiDialogContext, TuiInput } from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { injectContext } from '@taiga-ui/polymorpheus';
import { UserRow } from './users.types';

@Component({
  imports: [FormsModule, TuiButton, TuiForm, TuiInput],
  templateUrl: './edit-user-dialog.component.html',
})
export class EditUserDialogComponent {
  private readonly http = inject(HttpClient);

  protected readonly context = injectContext<TuiDialogContext<UserRow, UserRow>>();
  protected email = this.context.data.email;
  protected status: UserRow['status'] = this.context.data.status;
  protected emailVerified = this.context.data.emailVerified;
  protected saving = false;

  protected cancel(): void {
    this.context.$implicit.complete();
  }

  protected save(): void {
    if (this.saving) {
      return;
    }

    this.saving = true;

    this.http
      .patch<UserRow>(`/api/users/${this.context.data.id}`, {
        email: this.email.trim(),
        status: this.status,
        emailVerified: this.emailVerified,
      })
      .subscribe({
        next: (user) => this.context.completeWith(user),
        error: () => {
          this.saving = false;
        },
      });
  }
}
