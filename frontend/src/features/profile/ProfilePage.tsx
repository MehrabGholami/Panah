import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ContactEmergencyOutlinedIcon from '@mui/icons-material/ContactEmergencyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { updateProfile, uploadAvatar } from '@/app/slices/authSlice';
import { GlassCard, JalaliDateField, UserAvatar } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type { UpdateProfileRequest } from '@/shared/types';
import { getProfileCompletionPercent, PROFILE_COMPLETION_THRESHOLD } from '@/shared/utils/profileCompletion';
import { toPersianDigits } from '@/shared/utils/persianDigits';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 3 * 1024 * 1024;

const SECTION_GAP = 2.5; // 20px between profile boxes
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const AVATAR_FORMATS = ['JPG', 'PNG', 'WebP'] as const;

function AvatarUploadHint() {
  const { t } = useTranslation('profile');

  return (
    <Box
      sx={{
        mt: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        bgcolor: 'rgba(34, 211, 238, 0.08)',
        border: 1,
        borderColor: 'rgba(34, 211, 238, 0.22)',
      }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.6 }}>
        {t('hints.avatarFormats')}
      </Typography>
      {AVATAR_FORMATS.map((format) => (
        <Chip
          key={format}
          label={format}
          size="small"
          variant="outlined"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 700,
            borderColor: 'rgba(34, 211, 238, 0.35)',
            color: 'primary.main',
            bgcolor: 'background.paper',
          }}
        />
      ))}
      <Chip
        icon={<StorageOutlinedIcon sx={{ fontSize: '14px !important' }} />}
        label={t('hints.avatarMaxSize')}
        size="small"
        variant="outlined"
        sx={{
          height: 22,
          fontSize: '0.7rem',
          fontWeight: 600,
          borderColor: 'divider',
          color: 'text.secondary',
          bgcolor: 'background.paper',
          '& .MuiChip-icon': { color: 'text.secondary', ml: 0.5 },
        }}
      />
    </Box>
  );
}

function ProfileSection({
  title,
  icon,
  children,
  fill = false,
  sx,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  fill?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <GlassCard
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...(fill && {
          flex: { xs: '0 0 auto', lg: 1 },
          display: { xs: 'block', lg: 'flex' },
          flexDirection: { lg: 'column' },
        }),
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(34, 211, 238, 0.12)',
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Box
        sx={
          fill
            ? { flex: { lg: 1 }, display: { lg: 'flex' }, flexDirection: { lg: 'column' } }
            : undefined
        }
      >
        {children}
      </Box>
    </GlassCard>
  );
}

function ProfileCompletionBanner({
  percent,
  threshold,
  onClose,
}: {
  percent: number;
  threshold: number;
  onClose: () => void;
}) {
  const { t } = useTranslation('profile');
  const isTargetReached = percent >= threshold;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 2, md: 2.25 },
        pr: { xs: 5.5, md: 6 },
        borderRadius: 3,
        border: 1,
        borderColor: isTargetReached ? 'rgba(16, 185, 129, 0.35)' : 'rgba(34, 211, 238, 0.35)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? isTargetReached
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(34, 211, 238, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)'
            : isTargetReached
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 211, 238, 0.06) 100%)'
              : 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
        boxShadow: isTargetReached
          ? '0 10px 28px rgba(16, 185, 129, 0.08)'
          : '0 10px 28px rgba(34, 211, 238, 0.08)',
        position: 'relative',
      }}
    >
      <IconButton
        size="small"
        onClick={onClose}
        aria-label={t('actions.cancel', { ns: 'common' })}
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: 'text.secondary',
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: isTargetReached ? 'rgba(16, 185, 129, 0.14)' : 'rgba(34, 211, 238, 0.14)',
            color: isTargetReached ? 'success.main' : 'primary.main',
          }}
        >
          <InfoOutlinedIcon />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" fontWeight={700} sx={{ mb: 0.75, lineHeight: 1.8 }}>
            {t('messages.completeProfileInvite')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.85 }}>
            {t('messages.completeProfileThanks')}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t('messages.completionProgress', {
                percent: toPersianDigits(percent),
                threshold: toPersianDigits(threshold),
              })}
            </Typography>
            <Chip
              size="small"
              label={
                isTargetReached
                  ? t('messages.completionReached')
                  : t('messages.completionRemaining', {
                      remaining: toPersianDigits(Math.max(0, threshold - percent)),
                    })
              }
              color={isTargetReached ? 'success' : 'primary'}
              variant="outlined"
              sx={{ fontWeight: 700, height: 24 }}
            />
          </Stack>

          <Box
            sx={{
              height: 10,
              borderRadius: 99,
              bgcolor: 'action.hover',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${Math.min(100, percent)}%`,
                height: '100%',
                borderRadius: 99,
                background: isTargetReached
                  ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                  : 'linear-gradient(90deg, #22d3ee, #6366f1)',
                transition: 'width 0.35s ease',
              }}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { hasAnyRole } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UpdateProfileRequest>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfileInvite, setShowProfileInvite] = useState(
    Boolean((location.state as { completeProfileInvite?: boolean } | null)?.completeProfileInvite),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  const canAccessProfile =
    hasAnyRole(['volunteer']) && !hasAnyRole(['admin', 'coordinator']);

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone: user.phone ?? '',
      city: user.volunteer_profile?.city ?? '',
      bio: user.volunteer_profile?.bio ?? '',
      education: user.profile?.education ?? '',
      occupation: user.profile?.occupation ?? '',
      interests: user.profile?.interests ?? '',
      address: user.profile?.address ?? '',
      blood_type: user.profile?.blood_type ?? '',
      languages: user.profile?.languages ?? '',
      years_of_experience: user.profile?.years_of_experience ?? null,
      date_of_birth: user.profile?.date_of_birth ?? '',
      emergency_contact_name: user.profile?.emergency_contact_name ?? '',
      emergency_contact_phone: user.profile?.emergency_contact_phone ?? '',
      medical_conditions: user.profile?.medical_conditions ?? '',
      disability: user.profile?.disability ?? '',
    });
  }, [user]);

  if (!canAccessProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (field: keyof UpdateProfileRequest, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const result = await dispatch(updateProfile(form));
    setIsSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      setSuccess(t('messages.saveSuccess'));
    } else {
      setError(t('actions.error', { ns: 'common' }));
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const typeAllowed = ALLOWED_TYPES.includes(file.type);
    const extAllowed = ALLOWED_EXTENSIONS.includes(extension);

    if (!typeAllowed && !extAllowed) {
      setError(t('messages.avatarInvalidType'));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t('messages.avatarTooLarge'));
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    const result = await dispatch(uploadAvatar(file));
    setIsUploading(false);
    if (uploadAvatar.fulfilled.match(result)) {
      setAvatarKey((k) => k + 1);
      setSuccess(t('messages.avatarSuccess'));
    } else {
      setError(t('actions.error', { ns: 'common' }));
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const optional = ` (${t('hints.optional')})`;
  const completionPercent = getProfileCompletionPercent(user);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', pb: 10, width: '100%' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('subtitle')}
      </Typography>

      {showProfileInvite && (
        <ProfileCompletionBanner
          percent={completionPercent}
          threshold={PROFILE_COMPLETION_THRESHOLD}
          onClose={() => setShowProfileInvite(false)}
        />
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <GlassCard
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: SECTION_GAP,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          width: '100%',
          boxSizing: 'border-box',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(15,23,42,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(248,250,252,1) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)',
                }}
              >
                <UserAvatar
                  key={avatarKey}
                  name={fullName}
                  src={user.avatar}
                  cacheKey={avatarKey}
                  sx={{
                    width: { xs: 96, sm: 112 },
                    height: { xs: 96, sm: 112 },
                    fontSize: '2.5rem',
                    border: 3,
                    borderColor: 'background.paper',
                  }}
                />
              </Box>
              {isUploading && (
                <CircularProgress
                  size={28}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    mt: '-14px',
                    ml: '-14px',
                  }}
                />
              )}
            </Box>
            <Typography variant="subtitle1" fontWeight={800} textAlign="center" sx={{ mt: 1.5 }}>
              {fullName}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user.email}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              hidden
              onChange={(e) => void handleAvatarSelect(e)}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {t('actions.uploadAvatar')}
            </Button>
            <AvatarUploadHint />
          </Box>
        </Stack>
      </GlassCard>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: SECTION_GAP,
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SECTION_GAP,
          }}
        >
          <ProfileSection title={t('sections.basic')} icon={<PersonOutlineIcon fontSize="small" />}>
            <Stack spacing={2}>
              <TextField
                label={t('fields.email')}
                value={user.email}
                fullWidth
                size="small"
                disabled
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('fields.firstName')}
                  value={form.first_name ?? ''}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('fields.lastName')}
                  value={form.last_name ?? ''}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Stack>
              <TextField
                label={t('fields.phone')}
                value={form.phone ?? ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>
          </ProfileSection>

          {user.volunteer_profile && (
            <ProfileSection
              title={t('sections.volunteer')}
              icon={<VolunteerActivismOutlinedIcon fontSize="small" />}
            >
              <Stack spacing={2}>
                <TextField
                  label={t('fields.nationalId')}
                  value={user.volunteer_profile.national_id ?? ''}
                  fullWidth
                  size="small"
                  disabled
                />
                <TextField
                  label={`${t('fields.city')}${optional}`}
                  value={form.city ?? ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={`${t('fields.bio')}${optional}`}
                  value={form.bio ?? ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                />
              </Stack>
            </ProfileSection>
          )}

          <ProfileSection
            title={t('sections.health')}
            icon={<AccessibilityNewOutlinedIcon fontSize="small" />}
            fill
          >
            <Stack spacing={2}>
              <TextField
                label={`${t('fields.medicalConditions')}${optional}`}
                value={form.medical_conditions ?? ''}
                onChange={(e) => handleChange('medical_conditions', e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
                placeholder={t('hints.medicalConditions')}
              />
              <TextField
                label={`${t('fields.disability')}${optional}`}
                value={form.disability ?? ''}
                onChange={(e) => handleChange('disability', e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
                placeholder={t('hints.disability')}
              />
            </Stack>
          </ProfileSection>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SECTION_GAP,
          }}
        >
          <ProfileSection title={t('sections.professional')} icon={<SchoolOutlinedIcon fontSize="small" />}>
            <Stack spacing={2}>
              <TextField
                label={`${t('fields.education')}${optional}`}
                value={form.education ?? ''}
                onChange={(e) => handleChange('education', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={`${t('fields.occupation')}${optional}`}
                value={form.occupation ?? ''}
                onChange={(e) => handleChange('occupation', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={`${t('fields.yearsOfExperience')}${optional}`}
                type="number"
                value={form.years_of_experience ?? ''}
                onChange={(e) =>
                  handleChange(
                    'years_of_experience',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
              />
              <TextField
                label={`${t('fields.interests')}${optional}`}
                value={form.interests ?? ''}
                onChange={(e) => handleChange('interests', e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
                placeholder={t('hints.interests')}
              />
            </Stack>
          </ProfileSection>

          <ProfileSection title={t('sections.personal')} icon={<BadgeOutlinedIcon fontSize="small" />}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <JalaliDateField
                  label={`${t('fields.dateOfBirth')}${optional}`}
                  value={form.date_of_birth ?? null}
                  onChange={(value) => handleChange('date_of_birth', value)}
                />
                <TextField
                  label={`${t('fields.bloodType')}${optional}`}
                  value={form.blood_type ?? ''}
                  onChange={(e) => handleChange('blood_type', e.target.value)}
                  fullWidth
                  size="small"
                  select
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => (value ? String(value) : ''),
                  }}
                >
                  {BLOOD_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <TextField
                label={`${t('fields.languages')}${optional}`}
                value={form.languages ?? ''}
                onChange={(e) => handleChange('languages', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={`${t('fields.address')}${optional}`}
                value={form.address ?? ''}
                onChange={(e) => handleChange('address', e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
            </Stack>
          </ProfileSection>

          <ProfileSection
            title={t('sections.emergency')}
            icon={<ContactEmergencyOutlinedIcon fontSize="small" />}
            fill
          >
            <Stack spacing={2}>
              <TextField
                label={`${t('fields.emergencyContactName')}${optional}`}
                value={form.emergency_contact_name ?? ''}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={`${t('fields.emergencyContactPhone')}${optional}`}
                value={form.emergency_contact_phone ?? ''}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>
          </ProfileSection>
        </Box>
      </Box>

      <Box
        sx={{
          pt: 2,
          mt: 1,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={() => void handleSave()}
          disabled={isSaving}
          sx={{ minWidth: 180, borderRadius: 2 }}
        >
          {isSaving ? <CircularProgress size={22} color="inherit" /> : t('actions.save')}
        </Button>
      </Box>
    </Box>
  );
}
