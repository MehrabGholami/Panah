import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Grid2 as Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GlassCard, StatusChip, UserAvatar, type StatusVariant } from '@/shared/components/ui';
import type { Volunteer, VolunteerAvailability } from '@/shared/types';
import { toPersianDigits } from '@/shared/utils/persianDigits';

interface VolunteerDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  volunteer: Volunteer | null;
  volunteerName: string;
  statusKey: StatusVariant;
  statusLabel: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(34, 211, 238, 0.12)',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
      {title}
    </Typography>
  );
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim());
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return toPersianDigits(new Date(value).toLocaleDateString('fa-IR'));
}

function formatAvailability(
  availability: Volunteer['availability'],
  t: (key: string) => string,
): string[] {
  if (!availability || typeof availability !== 'object') return [];
  const data = availability as VolunteerAvailability;
  const parts: string[] = [];
  if (data.weekdays !== undefined) {
    parts.push(`${t('availability.weekdays')}: ${data.weekdays ? t('availability.yes') : t('availability.no')}`);
  }
  if (data.weekends !== undefined) {
    parts.push(`${t('availability.weekends')}: ${data.weekends ? t('availability.yes') : t('availability.no')}`);
  }
  if (Array.isArray(data.shifts) && data.shifts.length > 0) {
    const shifts = data.shifts
      .map((shift) => t(`availability.${shift}`))
      .join('، ');
    parts.push(`${t('availability.shifts')}: ${shifts}`);
  }
  return parts;
}

function VolunteerSkills({ volunteer, label }: { volunteer: Volunteer; label: string }) {
  if (!volunteer.skills?.length && !volunteer.custom_skills?.length) {
    return null;
  }

  return (
    <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
      <SectionTitle title={label} />
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
        {volunteer.skills?.map((skill) => (
          <Chip
            key={skill.name}
            size="small"
            label={`${skill.name} (${toPersianDigits(skill.proficiency)})`}
            sx={{
              fontWeight: 600,
              borderColor: 'rgba(34, 211, 238, 0.35)',
            }}
            variant="outlined"
          />
        ))}
        {volunteer.custom_skills?.map((skill) => (
          <Chip
            key={skill}
            size="small"
            label={skill}
            color="secondary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>
    </GlassCard>
  );
}

export function VolunteerDetailModal({
  open,
  onClose,
  title,
  volunteer,
  volunteerName,
  statusKey,
  statusLabel,
  isLoading = false,
  children,
  footer,
}: VolunteerDetailModalProps) {
  const { t } = useTranslation(['volunteers', 'common']);

  const availabilityLines = formatAvailability(volunteer?.availability, t);
  const profileTiles = [
    volunteer?.national_id
      ? {
          icon: <BadgeOutlinedIcon fontSize="small" />,
          label: t('fields.nationalId'),
          value: toPersianDigits(volunteer.national_id),
        }
      : null,
    volunteer?.city
      ? {
          icon: <LocationOnOutlinedIcon fontSize="small" />,
          label: t('fields.city'),
          value: volunteer.city,
        }
      : null,
    hasText(volunteer?.address)
      ? {
          icon: <HomeOutlinedIcon fontSize="small" />,
          label: t('fields.address'),
          value: volunteer!.address!,
        }
      : null,
    volunteer?.date_of_birth
      ? {
          icon: <PersonOutlineOutlinedIcon fontSize="small" />,
          label: t('fields.dateOfBirth'),
          value: formatDate(volunteer.date_of_birth),
        }
      : null,
    volunteer?.created_at
      ? {
          icon: <EventAvailableOutlinedIcon fontSize="small" />,
          label: t('fields.registeredAt'),
          value: formatDate(volunteer.created_at),
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const professionalTiles = [
    hasText(volunteer?.education)
      ? {
          icon: <SchoolOutlinedIcon fontSize="small" />,
          label: t('fields.education'),
          value: volunteer!.education!,
        }
      : null,
    hasText(volunteer?.occupation)
      ? {
          icon: <WorkOutlineOutlinedIcon fontSize="small" />,
          label: t('fields.occupation'),
          value: volunteer!.occupation!,
        }
      : null,
    hasText(volunteer?.languages)
      ? {
          icon: <TranslateOutlinedIcon fontSize="small" />,
          label: t('fields.languages'),
          value: volunteer!.languages!,
        }
      : null,
    volunteer?.years_of_experience != null
      ? {
          icon: <EventAvailableOutlinedIcon fontSize="small" />,
          label: t('fields.yearsOfExperience'),
          value: `${toPersianDigits(volunteer.years_of_experience)} سال`,
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const healthTiles = [
    hasText(volunteer?.blood_type)
      ? {
          icon: <BloodtypeOutlinedIcon fontSize="small" />,
          label: t('fields.bloodType'),
          value: volunteer!.blood_type!,
        }
      : null,
    hasText(volunteer?.medical_conditions)
      ? {
          icon: <LocalHospitalOutlinedIcon fontSize="small" />,
          label: t('fields.medicalConditions'),
          value: volunteer!.medical_conditions!,
        }
      : null,
    hasText(volunteer?.disability)
      ? {
          icon: <LocalHospitalOutlinedIcon fontSize="small" />,
          label: t('fields.disability'),
          value: volunteer!.disability!,
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const emergencyTiles = [
    hasText(volunteer?.emergency_contact_name)
      ? {
          icon: <PersonOutlineOutlinedIcon fontSize="small" />,
          label: t('fields.emergencyContactName'),
          value: volunteer!.emergency_contact_name!,
        }
      : null,
    hasText(volunteer?.emergency_contact_phone)
      ? {
          icon: <PhoneOutlinedIcon fontSize="small" />,
          label: t('fields.emergencyContactPhone'),
          value: toPersianDigits(volunteer!.emergency_contact_phone!),
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="volunteer-detail-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: 'min(92vh, 920px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.45)',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            bgcolor: 'rgba(2, 6, 23, 0.72)',
          },
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          position: 'relative',
          px: 3,
          pt: 2.5,
          pb: 6,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 55%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography
            id="volunteer-detail-title"
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: 'primary.contrastText', opacity: 0.95 }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="بستن"
            sx={{
              color: 'primary.contrastText',
              bgcolor: 'rgba(255,255,255,0.14)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack alignItems="center" spacing={1}>
          <UserAvatar
            name={volunteerName}
            src={volunteer?.avatar}
            sx={{
              width: 84,
              height: 84,
              fontSize: '2rem',
              border: '4px solid rgba(255,255,255,0.9)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }}
          />
          <Typography variant="h5" fontWeight={800} sx={{ color: 'primary.contrastText' }}>
            {volunteerName}
          </Typography>
          <StatusChip
            status={statusKey}
            label={statusLabel}
            sx={{
              mt: 0.25,
              bgcolor: 'rgba(255,255,255,0.22) !important',
              color: '#fff !important',
              fontWeight: 700,
            }}
          />
        </Stack>
      </Box>

      <DialogContent
        dividers={false}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, sm: 3 },
          pt: 0,
          pb: 2,
          mt: -4,
          '&.MuiDialogContent-root': {
            paddingTop: 0,
          },
        }}
      >
        <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
          {isLoading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={64} />
              <Skeleton variant="rounded" height={64} />
              <Skeleton variant="rounded" height={64} />
            </Stack>
          ) : (
            <>
              <SectionTitle title={t('sections.contact')} />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoTile
                    icon={<EmailOutlinedIcon fontSize="small" />}
                    label={t('table.email', { ns: 'common' })}
                    value={volunteer?.email || '—'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoTile
                    icon={<PhoneOutlinedIcon fontSize="small" />}
                    label={t('table.phone', { ns: 'common' })}
                    value={volunteer?.phone ? toPersianDigits(volunteer.phone) : '—'}
                  />
                </Grid>
              </Grid>

              {hasText(volunteer?.bio) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <SectionTitle title={t('fields.bio')} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}
                  >
                    {volunteer?.bio}
                  </Typography>
                </>
              )}
            </>
          )}
        </GlassCard>

        {!isLoading && profileTiles.length > 0 && (
          <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <SectionTitle title={t('sections.profile')} />
            <Grid container spacing={1.5}>
              {profileTiles.map((tile) => (
                <Grid key={tile.label} size={{ xs: 12, sm: 6 }}>
                  <InfoTile icon={tile.icon} label={tile.label} value={tile.value} />
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        )}

        {!isLoading && professionalTiles.length > 0 && (
          <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <SectionTitle title={t('sections.professional')} />
            <Grid container spacing={1.5}>
              {professionalTiles.map((tile) => (
                <Grid key={tile.label} size={{ xs: 12, sm: 6 }}>
                  <InfoTile icon={tile.icon} label={tile.label} value={tile.value} />
                </Grid>
              ))}
            </Grid>
            {hasText(volunteer?.interests) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
              >
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {t('fields.interests')}:{' '}
                </Box>
                {volunteer?.interests}
              </Typography>
            )}
          </GlassCard>
        )}

        {!isLoading && healthTiles.length > 0 && (
          <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <SectionTitle title={t('sections.health')} />
            <Grid container spacing={1.5}>
              {healthTiles.map((tile) => (
                <Grid key={tile.label} size={{ xs: 12, sm: 6 }}>
                  <InfoTile icon={tile.icon} label={tile.label} value={tile.value} />
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        )}

        {!isLoading && emergencyTiles.length > 0 && (
          <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <SectionTitle title={t('sections.emergency')} />
            <Grid container spacing={1.5}>
              {emergencyTiles.map((tile) => (
                <Grid key={tile.label} size={{ xs: 12, sm: 6 }}>
                  <InfoTile icon={tile.icon} label={tile.label} value={tile.value} />
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        )}

        {!isLoading && availabilityLines.length > 0 && (
          <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <SectionTitle title={t('sections.availability')} />
            <Stack spacing={0.75}>
              {availabilityLines.map((line) => (
                <Typography key={line} variant="body2" color="text.secondary" fontWeight={600}>
                  {line}
                </Typography>
              ))}
            </Stack>
          </GlassCard>
        )}

        {!isLoading && volunteer && (
          <VolunteerSkills volunteer={volunteer} label={t('sections.skills')} />
        )}

        {children}
      </DialogContent>

      {footer && (
        <Box
          sx={{
            flexShrink: 0,
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {footer}
        </Box>
      )}
    </Dialog>
  );
}
