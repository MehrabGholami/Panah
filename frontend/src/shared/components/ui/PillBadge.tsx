import { Box, Typography } from '@mui/material';

interface PillBadgeProps {
  label: string;
}

export function PillBadge({ label }: PillBadgeProps) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 2.5,
        py: 0.75,
        borderRadius: 999,
        border: '1px solid rgba(34, 211, 238, 0.3)',
        bgcolor: 'rgba(34, 211, 238, 0.06)',
      }}
    >
      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}
