import { Directive } from '@angular/core';

@Directive({
  selector: 'input[atlasInput], textarea[atlasInput], select[atlasSelect]',
  host: { class: 'atlas-control' },
})
export class AtlasControlDirective {}
