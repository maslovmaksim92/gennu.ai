import { Component, input, output } from '@angular/core';
import { ProtoButtonDirective } from './proto-button.directive';

@Component({
  selector: 'proto-dialog',
  standalone: true,
  imports: [ProtoButtonDirective],
  templateUrl: './proto-dialog.component.html',
  host: { class: 'proto-dialog-host' },
})
export class ProtoDialogComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly close = output<void>();
}
