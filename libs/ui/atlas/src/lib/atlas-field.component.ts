import { Component, input } from '@angular/core';

@Component({
  selector: 'atlas-field',
  standalone: true,
  templateUrl: './atlas-field.component.html',
  host: { class: 'atlas-field' },
})
export class AtlasFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly error = input<string>('');
}
