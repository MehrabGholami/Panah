import { toPersianDigits } from './persianDigits';

export function formatMissionEndDate(
  endTime?: string | null,
  isTba?: boolean,
  tbaLabel = 'متعاقباً اعلام می‌شود',
): string {
  if (isTba) return tbaLabel;
  if (!endTime) return '—';
  return toPersianDigits(new Date(endTime).toLocaleDateString('fa-IR'));
}
