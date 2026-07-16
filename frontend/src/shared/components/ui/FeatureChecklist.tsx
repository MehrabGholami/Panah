import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Typography } from '@mui/material';

interface FeatureChecklistProps {
  items: string[];
  compact?: boolean;
  align?: 'start' | 'center';
  tone?: 'default' | 'light';
}

export function FeatureChecklist({
  items,
  compact = false,
  align = 'center',
  tone = 'default',
}: FeatureChecklistProps) {
  const textColor = tone === 'light' ? 'rgba(226, 232, 240, 0.92)' : 'text.secondary';

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'start' ? 'flex-start' : 'center',
        gap: compact ? { xs: 1, sm: 1.5, md: 2 } : { xs: 2, sm: 3, md: 4 },
        mt: compact ? { xs: 0, md: 0 } : 6,
        px: align === 'start' ? 0 : 2,
      }}
    >
      {items.map((item) => (
        <Box
          key={item}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            minWidth: compact ? 'auto' : { xs: '100%', sm: '45%', md: 'auto' },
            justifyContent: align === 'start' ? 'flex-start' : 'center',
          }}
        >
          <CheckCircleOutlineIcon
            sx={{ color: tone === 'light' ? '#22D3EE' : 'primary.main', fontSize: compact ? 16 : 20 }}
          />
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: compact ? { xs: '0.7rem', sm: '0.75rem' } : undefined,
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
            }}
          >
            {item}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
