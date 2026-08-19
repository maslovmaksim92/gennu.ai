import { Directive, input } from '@angular/core';

export type AtlasButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AtlasButtonSize = 'sm' | 'md';

@Directive({
  selector: 'button[atlasButton]',
  standalone: true,
  host: {
    class: 'atlas-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class AtlasButtonDirective {
  readonly variant = input<AtlasButtonVariant>('primary');
  readonly size = input<AtlasButtonSize>('md');
}
