import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, isValid, parse } from 'date-fns';

function parseIsoDate(value?: string | null) {
  if (!value) return null;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

interface JalaliDateFieldProps {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export function JalaliDateField({
  label,
  value,
  onChange,
  fullWidth = true,
  size = 'small',
  disabled = false,
}: JalaliDateFieldProps) {
  return (
    <DatePicker
      label={label}
      value={parseIsoDate(value)}
      onChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : null)}
      disabled={disabled}
      format="yyyy/MM/dd"
      slotProps={{
        textField: {
          fullWidth,
          size,
        },
        field: { clearable: true },
        actionBar: { actions: ['clear', 'today'] },
      }}
    />
  );
}
