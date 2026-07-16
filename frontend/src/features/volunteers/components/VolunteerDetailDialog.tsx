import { useTranslation } from 'react-i18next';
import type { StatusVariant } from '@/shared/components/ui';
import type { Volunteer } from '@/shared/types';
import { VolunteerDetailModal } from './VolunteerDetailModal';

interface VolunteerDetailDialogProps {
  volunteer: Volunteer | null;
  open: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function VolunteerDetailDialog({
  volunteer,
  open,
  onClose,
  actions,
}: VolunteerDetailDialogProps) {
  const { t } = useTranslation(['volunteers', 'common']);

  if (!volunteer) return null;

  const fullName = `${volunteer.first_name} ${volunteer.last_name}`.trim() || volunteer.email;
  const statusKey: StatusVariant =
    volunteer.status === 'active'
      ? 'approved'
      : volunteer.status === 'pending_approval'
        ? 'pending'
        : 'rejected';

  return (
    <VolunteerDetailModal
      open={open}
      onClose={onClose}
      title={t('detail.title')}
      volunteer={volunteer}
      volunteerName={fullName}
      statusKey={statusKey}
      statusLabel={t(`status.${volunteer.status}`)}
      footer={actions}
    />
  );
}
