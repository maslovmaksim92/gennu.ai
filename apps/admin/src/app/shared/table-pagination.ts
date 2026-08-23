import { computed, signal, type Signal } from '@angular/core';
import type { TuiTablePaginationEvent } from '@taiga-ui/addon-table';

export interface TablePagination<T> {
  /** Page currently shown, clamped to the data that actually exists. */
  readonly page: Signal<number>;
  readonly size: Signal<number>;
  /** The slice to render. */
  readonly visible: Signal<readonly T[]>;
  readonly update: (event: TuiTablePaginationEvent) => void;
}

/**
 * Client-side pagination for the admin tables.
 *
 * The page is clamped rather than stored raw, so deleting the last row of the
 * last page shows the previous page instead of an empty table.
 */
export function tablePagination<T>(
  rows: Signal<readonly T[]>,
  initialSize = 25,
): TablePagination<T> {
  const requestedPage = signal(0);
  const size = signal(initialSize);

  const lastPage = computed(() => Math.max(0, Math.ceil(rows().length / size()) - 1));
  const page = computed(() => Math.min(requestedPage(), lastPage()));
  const visible = computed(() => {
    const start = page() * size();
    return rows().slice(start, start + size());
  });

  return {
    page,
    size,
    visible,
    update: (event: TuiTablePaginationEvent) => {
      size.set(event.size);
      requestedPage.set(event.page);
    },
  };
}
