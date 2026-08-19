import { Component, input } from '@angular/core';

@Component({
  selector: 'proto-field',
  standalone: true,
  templateUrl: './proto-field.component.html',
  host: { class: 'proto-field' },
})
export class ProtoFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly error = input<string>('');
}
