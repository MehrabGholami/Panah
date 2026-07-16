import { Card, type CardProps } from '@mui/material';

export function GlassCard({ children, sx, ...props }: CardProps) {
  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        backdropFilter: 'blur(8px)',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
