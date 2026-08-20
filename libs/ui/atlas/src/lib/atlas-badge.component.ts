import { Component, input } from '@angular/core';

export type AtlasBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'atlas-badge',
  templateUrl: './atlas-badge.component.html',
  host: {
    class: 'atlas-badge',
    '[attr.data-variant]': 'variant()',
  },
})
export class AtlasBadgeComponent {
  readonly variant = input<AtlasBadgeVariant>('neutral');
}
