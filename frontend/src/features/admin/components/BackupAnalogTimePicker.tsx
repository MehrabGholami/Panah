import { Box, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toLatinDigits } from '@/shared/utils/persianDigits';

interface BackupAnalogTimePickerProps {
  hour: number;
  minute: number;
  disabled?: boolean;
  onChange: (next: { hour: number; minute: number }) => void;
  hourLabel: string;
  minuteLabel: string;
}

const DIGIT_FONT =
  '"Orbitron", "Share Tech Mono", "Courier New", ui-monospace, monospace';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function clampInt(raw: string, max: number): number | null {
  const digits = toLatinDigits(raw).replace(/\D/g, '').slice(0, 2);
  if (digits === '') return null;
  const n = Number(digits);
  if (Number.isNaN(n) || n < 0 || n > max) return null;
  return n;
}

export function BackupAnalogTimePicker({
  hour,
  minute,
  disabled = false,
  onChange,
  hourLabel,
  minuteLabel,
}: BackupAnalogTimePickerProps) {
  const { t } = useTranslation('ops');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hourDraft, setHourDraft] = useState<string | null>(null);
  const [minuteDraft, setMinuteDraft] = useState<string | null>(null);

  const safeHour = ((hour % 24) + 24) % 24;
  const safeMinute = ((minute % 60) + 60) % 60;

  const hourDisplay = hourDraft ?? pad2(safeHour);
  const minuteDisplay = minuteDraft ?? pad2(safeMinute);

  const fieldSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: 999,
      fontWeight: 800,
      fontSize: '1.1rem',
      borderColor: 'rgba(34, 211, 238, 0.28)',
      bgcolor: (muiTheme: { palette: { mode: string } }) =>
        muiTheme.palette.mode === 'dark' ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.95)',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(34, 211, 238, 0.55)',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: 'primary.main',
      },
      '& input': {
        textAlign: 'center',
        py: 1.15,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 1.5,
        fontFamily: DIGIT_FONT,
        color: isDark ? '#E0F2FE' : '#0E7490',
      },
    },
  } as const;

  return (
    <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 300 }}>
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 280,
          opacity: disabled ? 0.55 : 1,
          pointerEvents: 'none',
          userSelect: 'none',
          borderRadius: 3,
          p: '10px',
          border: '1px solid',
          borderColor: isDark ? 'rgba(34, 211, 238, 0.28)' : 'rgba(34, 211, 238, 0.22)',
          background: isDark
            ? 'linear-gradient(160deg, #1A2238 0%, #12182A 45%, #0B0F1A 100%)'
            : 'linear-gradient(160deg, #E0F2FE 0%, #CFFAFE 40%, #A5F3FC 100%)',
          boxShadow: isDark
            ? `
              0 16px 36px rgba(8, 47, 73, 0.35),
              inset 0 1px 0 rgba(103, 232, 249, 0.18),
              inset 0 -6px 14px rgba(11, 15, 26, 0.55)
            `
            : `
              0 16px 32px rgba(8, 145, 178, 0.14),
              inset 0 1px 0 rgba(255,255,255,0.85),
              inset 0 -4px 12px rgba(8, 145, 178, 0.08)
            `,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            background: isDark
              ? 'linear-gradient(135deg, rgba(34,211,238,0.14) 0%, transparent 45%, rgba(129,140,248,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 50%, rgba(129,140,248,0.12) 100%)',
            pointerEvents: 'none',
          }}
        />

        <Box
          dir="ltr"
          sx={{
            position: 'relative',
            borderRadius: 2,
            px: 2.5,
            py: 3,
            background: isDark
              ? 'radial-gradient(120% 100% at 50% 0%, #1A2238 0%, #0B0F1A 58%, #070A12 100%)'
              : 'radial-gradient(120% 100% at 50% 0%, #F0FDFF 0%, #ECFEFF 55%, #E0F2FE 100%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(34, 211, 238, 0.22)' : 'rgba(8, 145, 178, 0.2)',
            boxShadow: isDark
              ? 'inset 0 0 28px rgba(34,211,238,0.08), inset 0 1px 0 rgba(103,232,249,0.1)'
              : 'inset 0 0 20px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            unicodeBidi: 'isolate',
            fontFamily: DIGIT_FONT,
            fontWeight: 700,
            fontSize: { xs: '2.6rem', sm: '2.85rem' },
            letterSpacing: '0.12em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            color: isDark ? '#67E8F9' : '#0891B2',
            textShadow: isDark
              ? '0 0 8px rgba(34,211,238,0.85), 0 0 22px rgba(34,211,238,0.45), 0 0 40px rgba(129,140,248,0.25)'
              : '0 0 10px rgba(34,211,238,0.35), 0 0 22px rgba(8,145,178,0.2)',
          }}
        >
          <Box component="span">{pad2(safeHour)}</Box>
          <Box
            component="span"
            sx={{
              px: '0.08em',
              color: isDark ? '#A5B4FC' : '#6366F1',
              animation: 'backupColonBlink 1.15s steps(1, end) infinite',
              '@keyframes backupColonBlink': {
                '0%, 49%': { opacity: 1 },
                '50%, 100%': { opacity: 0.18 },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            :
          </Box>
          <Box component="span">{pad2(safeMinute)}</Box>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ textAlign: 'center' }}
      >
        {t('digitalClockHint')}
      </Typography>

      <Stack direction="row" spacing={1.25} sx={{ width: '100%' }} dir="ltr">
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            display="block"
            textAlign="center"
            mb={0.5}
          >
            {hourLabel}
          </Typography>
          <TextField
            value={hourDisplay}
            disabled={disabled}
            fullWidth
            inputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              'aria-label': hourLabel,
              dir: 'ltr',
            }}
            onFocus={() => setHourDraft(pad2(safeHour))}
            onChange={(e) => {
              const latin = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
              setHourDraft(latin);
              const parsed = clampInt(latin, 23);
              if (parsed != null) onChange({ hour: parsed, minute: safeMinute });
            }}
            onBlur={() => {
              const parsed = clampInt(hourDraft ?? '', 23);
              onChange({ hour: parsed ?? safeHour, minute: safeMinute });
              setHourDraft(null);
            }}
            sx={fieldSx}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            display="block"
            textAlign="center"
            mb={0.5}
          >
            {minuteLabel}
          </Typography>
          <TextField
            value={minuteDisplay}
            disabled={disabled}
            fullWidth
            inputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              'aria-label': minuteLabel,
              dir: 'ltr',
            }}
            onFocus={() => setMinuteDraft(pad2(safeMinute))}
            onChange={(e) => {
              const latin = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
              setMinuteDraft(latin);
              const parsed = clampInt(latin, 59);
              if (parsed != null) onChange({ hour: safeHour, minute: parsed });
            }}
            onBlur={() => {
              const parsed = clampInt(minuteDraft ?? '', 59);
              onChange({ hour: safeHour, minute: parsed ?? safeMinute });
              setMinuteDraft(null);
            }}
            sx={fieldSx}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
