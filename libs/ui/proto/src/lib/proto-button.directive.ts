import { Directive, input } from '@angular/core';

export type ProtoButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ProtoButtonSize = 'sm' | 'md';

@Directive({
  selector: 'button[protoButton]',
  standalone: true,
  host: {
    class: 'proto-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class ProtoButtonDirective {
  readonly variant = input<ProtoButtonVariant>('primary');
  readonly size = input<ProtoButtonSize>('md');
}
