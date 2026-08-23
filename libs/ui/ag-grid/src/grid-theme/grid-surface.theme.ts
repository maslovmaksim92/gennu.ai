import { iconSetMaterial, themeQuartz } from 'ag-grid-community';

export const GridSurfaceDark = themeQuartz.withPart(iconSetMaterial).withParams({
  accentColor: 'var(--primary)',
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--outline-variant)',
  borderRadius: '4px',
  browserColorScheme: 'inherit',
  chromeBackgroundColor: 'var(--surface-container-highest)',
  fontFamily: {
    googleFont: 'Roboto',
  },
  foregroundColor: 'var(--on-surface)',
  headerBackgroundColor: 'var(--surface)',
  headerFontFamily: {
    googleFont: 'Roboto',
  },
  headerFontSize: 14,
  headerFontWeight: 500,
  headerVerticalPaddingScale: 0.9,
  rowBorder: true,
  rowVerticalPaddingScale: 0.95,
  sidePanelBorder: false,
  wrapperBorder: false,
  wrapperBorderRadius: '4px',
  rowHeight: 40,
  headerHeight: 44,
  listItemHeight: 40,
});

export const GridSurfaceLight = themeQuartz.withPart(iconSetMaterial).withParams({
  accentColor: 'var(--primary)',
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--outline-variant)',
  browserColorScheme: 'light',
  cellHorizontalPaddingScale: 0.95,
  fontFamily: {
    googleFont: 'Roboto',
  },
  foregroundColor: 'var(--on-surface)',
  headerBackgroundColor: 'var(--surface)',
  headerFontFamily: {
    googleFont: 'Roboto',
  },
  headerFontSize: 14,
  iconSize: '16px',
  rowVerticalPaddingScale: 0.9,
  sidePanelBorder: false,
  wrapperBorder: false,
  wrapperBorderRadius: '4px',
  rowHeight: 40,
  headerHeight: 44,
  listItemHeight: 40,
});
