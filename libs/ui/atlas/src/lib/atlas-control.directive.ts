import { Directive } from '@angular/core';

@Directive({
  selector: 'input[atlasInput], textarea[atlasInput], select[atlasSelect]',
  standalone: true,
  host: { class: 'atlas-control' },
})
export class AtlasControlDirective {}
