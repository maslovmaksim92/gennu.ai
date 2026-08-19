import { Directive } from '@angular/core';

@Directive({
  selector: 'input[protoInput], textarea[protoInput], select[protoSelect]',
  standalone: true,
  host: { class: 'proto-control' },
})
export class ProtoControlDirective {}
