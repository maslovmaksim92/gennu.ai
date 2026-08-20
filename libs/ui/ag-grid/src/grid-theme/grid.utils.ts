import { GetRowIdParams, GridOptions } from 'ag-grid-community';
import { gridLocale } from '../grid-locale';

export const ColumnTypes = {
  centerAligned: {
    headerClass: 'ag-center-aligned',
    cellClass: 'ag-center-aligned',
  },
} as const;

export const HalfGridOptions: GridOptions<unknown> = {
  localeText: gridLocale,
  rowSelection: {
    mode: 'singleRow',
  },
  getRowId: (params: GetRowIdParams) => String(params.data.id),
};
