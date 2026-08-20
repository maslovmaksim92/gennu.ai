import { ColDef, ITooltipParams, SideBarDef } from 'ag-grid-community';

export const pageSizeSelector = [25, 50, 75, 100] as const;

export const dateColumnDef = {
  filter: 'agDateColumnFilter',
  cellDataType: 'dateString',
  filterParams: {
    includeTime: false,
    defaultOption: 'equals',
    filterPlaceholder: $localize`Выберите дату`,
    browserDatePicker: true,
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string | null): number => {
      if (!cellValue) {
        return -1;
      }

      const cellDate = new Date(cellValue);
      cellDate.setHours(0, 0, 0, 0);

      const cellTime = cellDate.getTime();
      const filterTime = filterLocalDateAtMidnight.getTime();

      if (cellTime < filterTime) {
        return -1;
      }
      if (cellTime > filterTime) {
        return 1;
      }
      return 0;
    },
    // buttons: ['clear'],
  },
  width: 145,
  minWidth: 145,
  // suppressFloatingFilterButton: true,
  // suppressHeaderFilterButton: true,
} satisfies Partial<ColDef>;

export const bigGridDefaultColDef = {
  sortable: true,
  filter: true,
  floatingFilter: true,
  resizable: true,
  minWidth: 65,
  enableRowGroup: true,
  // suppressSizeToFit: false,
  wrapText: false,
  autoHeight: false,
  suppressMovable: false,
  lockVisible: false,
  lockPinned: true,
  // flex: 1.2,
  // suppressAutoSize: true,
  tooltipValueGetter: (params: ITooltipParams) => params.valueFormatted ?? params.value,
} satisfies ColDef;

export const defaultColDef: ColDef = {
  sortable: false,
  filter: false,
  floatingFilter: false,
  //  Установите значение `false`, чтобы отключить изменение размера, которое включено по умолчанию.
  resizable: false,
  minWidth: 42,
  // Установите значение `true`, если хотите иметь возможность группировать строки по этому столбцу через графический интерфейс.
  enableRowGroup: true,
  // Установите значение `true`, если хотите, чтобы ширина этого столбца
  //  оставалась фиксированной во время операций подгонки размера.
  suppressSizeToFit: false,
  // Установите значение `true`, если вы не хотите, чтобы этот столбец автоматически изменял
  //  свой размер во время операций «изменение размера по содержимому».
  suppressAutoSize: false,
  // Увеличивается пропорционально все колонки(чтобы таблица занимала всю ширину, sizeColumnsToFit не работает)
  flex: 1.2,
  // Скрываем меню для column
  suppressHeaderMenuButton: true,
  // Контекстное меню для строк
  // contextMenuItems: [],// [ContextMenuModule]
  wrapText: true,
  autoHeight: true,
  // Запрещает пользователю перемещать столбец
  suppressMovable: true,
  // Предотвращает скрытие столбца при перетаскивании его за пределы сетки
  lockVisible: true,
};

export const SIDE_BAR_COLUMN_KEY = 'columns';
export const SIDE_BAR_FILTERS_KEY = 'filters';

export const sideBarDef: SideBarDef = {
  toolPanels: [
    {
      id: SIDE_BAR_COLUMN_KEY,
      labelDefault: 'Columns',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
      toolPanelParams: {
        // suppressRowGroups: true,
        suppressValues: true,
        suppressPivots: true,
        suppressPivotMode: true,
        // suppressRowGroups: true,
        // suppressColumnFilter: true,
        // suppressColumnSelectAll: true,
        // suppressColumnExpandAll: true,
      },
    },
    SIDE_BAR_FILTERS_KEY,
  ],
  position: 'right',
  hiddenByDefault: false,
};
