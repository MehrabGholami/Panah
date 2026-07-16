import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Box, Divider, Link, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { MissionApplicationReviewActions } from '@/features/missions/components/MissionApplicationReviewActions';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GlassCard, type StatusVariant } from '@/shared/components/ui';
import type { MissionApplication, Volunteer } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import { VolunteerDetailModal } from './VolunteerDetailModal';

interface MissionApplicationDetailDialogProps {
  application: MissionApplication | null;
  open: boolean;
  onClose: () => void;
  isReviewPending?: boolean;
  onReview: (payload: {
    applicationId: string;
    action: 'approve' | 'waitlist' | 'reject';
    reviewNote?: string;
  }) => void;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(34, 211, 238, 0.1)',
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      {children}
    </GlassCard>
  );
}

export function MissionApplicationDetailDialog({
  application,
  open,
  onClose,
  isReviewPending,
  onReview,
}: MissionApplicationDetailDialogProps) {
  const { t } = useTranslation(['volunteers', 'missions', 'common']);

  const { data: volunteer, isLoading: volunteerLoading } = useQuery({
    queryKey: ['volunteers', application?.volunteer],
    queryFn: async () => {
      const { data } = await apiClient.get<Volunteer>(
        endpoints.volunteers.detail(application!.volunteer),
      );
      return data;
    },
    enabled: open && Boolean(application?.volunteer),
  });

  if (!application) return null;

  const volunteerName =
    application.volunteer_name ||
    [volunteer?.first_name, volunteer?.last_name].filter(Boolean).join(' ') ||
    application.volunteer_email ||
    '—';

  const statusKey: StatusVariant =
    application.status === 'waitlist'
      ? 'waitlist'
      : application.status === 'submitted'
        ? 'submitted'
        : application.status === 'approved'
          ? 'approved'
          : application.status === 'rejected'
            ? 'rejected'
            : 'pending';

  const displayVolunteer: Volunteer | null =
    volunteer ??
    (application.volunteer_email
      ? {
          id: application.volunteer,
          email: application.volunteer_email,
          first_name: application.volunteer_name?.split(' ')[0] || '',
          last_name: application.volunteer_name?.split(' ').slice(1).join(' ') || '',
          phone: '',
          status: 'active',
          custom_skills: [],
          skills: [],
          created_at: application.created_at,
        }
      : null);

  return (
    <VolunteerDetailModal
      open={open}
      onClose={onClose}
      title={t('missionApplications.detailTitle')}
      volunteer={displayVolunteer}
      volunteerName={volunteerName}
      statusKey={statusKey}
      statusLabel={t(`applicationStatus.${application.status}`, { ns: 'missions' })}
      isLoading={volunteerLoading && !volunteer}
      footer={
        <MissionApplicationReviewActions
          application={application}
          isPending={isReviewPending}
          onReview={(payload) => {
            onReview(payload);
            onClose();
          }}
        />
      }
    >
      <SectionCard icon={<AssignmentOutlinedIcon fontSize="small" />} title={t('missionApplications.mission')}>
        <Link
          component={RouterLink}
          to={`/missions/${application.mission}`}
          underline="hover"
          fontWeight={700}
          onClick={onClose}
          sx={{ fontSize: '0.95rem' }}
        >
          {application.mission_title}
        </Link>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25 }}>
          {t('missionApplications.date')}: {formatDate(application.created_at)}
        </Typography>
      </SectionCard>

      <SectionCard icon={<ChatBubbleOutlineIcon fontSize="small" />} title={t('missionApplications.message')}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
        >
          {application.message?.trim() || t('missionApplications.noMessage')}
        </Typography>
        {application.review_note && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              {t('missionApplications.reviewNote')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {application.review_note}
            </Typography>
          </>
        )}
      </SectionCard>
    </VolunteerDetailModal>
  );
}
