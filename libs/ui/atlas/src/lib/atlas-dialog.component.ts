import { Component, input, output } from '@angular/core';
import { AtlasButtonDirective } from './atlas-button.directive';

@Component({
  selector: 'atlas-dialog',
  imports: [AtlasButtonDirective],
  templateUrl: './atlas-dialog.component.html',
  host: { class: 'atlas-dialog-host' },
})
export class AtlasDialogComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly close = output<void>();
}
