import { Box, useTheme } from '@mui/material';

interface AnalogClockProps {
  date: Date;
  size?: number;
}

function polarToCartesian(center: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angleRad),
    y: center + radius * Math.sin(angleRad),
  };
}

export function AnalogClock({ date, size = 132 }: AnalogClockProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const faceFill = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.92)';
  const ringStroke = isDark ? 'rgba(34, 211, 238, 0.45)' : 'rgba(8, 145, 178, 0.35)';
  const tickColor = isDark ? 'rgba(148, 163, 184, 0.75)' : 'rgba(71, 85, 105, 0.65)';
  const handColor = isDark ? '#F8FAFC' : '#0F172A';
  const secondColor = theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        mx: 'auto',
        borderRadius: '50%',
        boxShadow: isDark
          ? '0 12px 32px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(34, 211, 238, 0.15)'
          : '0 12px 28px rgba(15, 23, 42, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="panahClockRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="47" fill="url(#panahClockRing)" />
        <circle cx="50" cy="50" r="44" fill={faceFill} stroke={ringStroke} strokeWidth="0.6" />

        {Array.from({ length: 12 }, (_, index) => {
          const angle = index * 30;
          const isMajor = index % 3 === 0;
          const start = polarToCartesian(50, isMajor ? 38 : 40, angle);
          const end = polarToCartesian(50, 45, angle);
          return (
            <line
              key={angle}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={tickColor}
              strokeWidth={isMajor ? 1.8 : 1}
              strokeLinecap="round"
            />
          );
        })}

        <line
          x1="50"
          y1="50"
          x2="50"
          y2="30"
          stroke={handColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          transform={`rotate(${hourDeg} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="22"
          stroke={handColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${minuteDeg} 50 50)`}
        />
        <line
          x1="50"
          y1="54"
          x2="50"
          y2="18"
          stroke={secondColor}
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondDeg} 50 50)`}
        />
        <circle cx="50" cy="50" r="2.8" fill={secondColor} />
        <circle cx="50" cy="50" r="1.2" fill={faceFill} />
      </svg>
    </Box>
  );
}
