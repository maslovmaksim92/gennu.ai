import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, type TuiDialogContext, TuiInput } from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { injectContext } from '@taiga-ui/polymorpheus';
import { AdminRow } from './admins.types';

@Component({
  imports: [FormsModule, TuiButton, TuiForm, TuiInput],
  templateUrl: './edit-admin-dialog.component.html',
})
export class EditAdminDialogComponent {
  private readonly http = inject(HttpClient);

  protected readonly context = injectContext<TuiDialogContext<AdminRow, AdminRow>>();
  protected email = this.context.data.email;
  protected status: AdminRow['status'] = this.context.data.status;
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
      .patch<AdminRow>(`/api/admins/${this.context.data.id}`, {
        email: this.email.trim(),
        status: this.status,
      })
      .subscribe({
        next: (admin) => this.context.completeWith(admin),
        error: () => {
          this.saving = false;
        },
      });
  }
}
