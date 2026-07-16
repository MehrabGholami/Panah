import { Chip, type ChipProps } from '@mui/material';

export type StatusVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'inactive'
  | 'draft'
  | 'open'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'accepted'
  | 'declined'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'reported'
  | 'active'
  | 'contained'
  | 'resolved'
  | 'submitted'
  | 'waitlist'
  | 'reviewed'
  | 'archived'
  | 'read'
  | 'sent'
  | 'failed'
  | 'answered'
  | 'closed';

const statusColors: Record<StatusVariant, { bg: string; color: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
  approved: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  rejected: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  inactive: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
  draft: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
  open: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' },
  published: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' },
  in_progress: { bg: 'rgba(34, 211, 238, 0.15)', color: '#22D3EE' },
  completed: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  cancelled: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  accepted: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  declined: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  low: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
  high: { bg: 'rgba(251, 146, 60, 0.15)', color: '#FB923C' },
  critical: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  reported: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' },
  active: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  contained: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
  resolved: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  submitted: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' },
  waitlist: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' },
  reviewed: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  archived: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
  read: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
  sent: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  failed: { bg: 'rgba(248, 113, 113, 0.15)', color: '#F87171' },
  answered: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
  closed: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
};

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusVariant;
  label: string;
}

export function StatusChip({ status, label, ...props }: StatusChipProps) {
  const colors = statusColors[status] ?? statusColors.inactive;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 500,
        borderRadius: 2,
      }}
      {...props}
    />
  );
}
