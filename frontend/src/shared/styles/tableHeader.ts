import type { SxProps, Theme } from '@mui/material/styles';

export const tableHeaderCellSx: SxProps<Theme> = {
  fontWeight: 800,
  fontSize: '0.78rem',
  letterSpacing: '0.02em',
  color: 'text.secondary',
  bgcolor: 'rgba(34, 211, 238, 0.06)',
  borderBottom: '1px solid',
  borderColor: 'divider',
  py: 1.5,
  px: 2,
  whiteSpace: 'nowrap',
  lineHeight: 1.35,
  verticalAlign: 'middle',
};

export const tableHeadSx: SxProps<Theme> = {
  '& .MuiTableCell-root': tableHeaderCellSx,
};
