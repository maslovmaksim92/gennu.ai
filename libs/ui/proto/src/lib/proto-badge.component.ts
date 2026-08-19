import { Component, input } from '@angular/core';

export type ProtoBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'proto-badge',
  standalone: true,
  templateUrl: './proto-badge.component.html',
  host: {
    class: 'proto-badge',
    '[attr.data-variant]': 'variant()',
  },
})
export class ProtoBadgeComponent {
  readonly variant = input<ProtoBadgeVariant>('neutral');
}
