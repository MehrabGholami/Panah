export type CsvColumn<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string | number | boolean | null | undefined;
  defaultSelected?: boolean;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvContent<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const raw = column.getValue(row);
        if (raw === null || raw === undefined) return '';
        return escapeCsvCell(String(raw));
      })
      .join(','),
  );
  return `\uFEFF${[header, ...lines].join('\r\n')}`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
