import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CrisisAlertOutlinedIcon from '@mui/icons-material/CrisisAlertOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import { GhostButton, GradientButton, JalaliDateField, SkillsMultiSelect } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/useAuth';
import type {
  CreateMissionRequest,
  Disaster,
  Mission,
  MissionPriority,
  PaginatedResponse,
} from '@/shared/types';
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage';

interface CreateMissionDialogProps {
  open: boolean;
  onClose: () => void;
  mission?: Mission | null;
  defaultDisasterId?: string | null;
}

const PRIORITIES: MissionPriority[] = ['low', 'medium', 'high', 'critical'];

type CoordinatorOption = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر اصلی',
  coordinator: 'هماهنگ‌کننده',
};

function getCoordinatorLabel(user: CoordinatorOption) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const roleLabel = user.roles
    .filter((role) => role === 'admin' || role === 'coordinator')
    .map((role) => ROLE_LABELS[role] ?? role)
    .join('، ');
  return `${fullName || user.email}${roleLabel ? ` — ${roleLabel}` : ''}`;
}

const initialForm: CreateMissionRequest = {
  disaster: '',
  title: '',
  description: '',
  priority: 'medium',
  province: '',
  city: '',
  location: '',
  start_time: null,
  end_time: null,
  is_end_time_tba: false,
  required_volunteers: 1,
  special_considerations: '',
  equipment_needed: '',
  safety_notes: '',
  is_visible_to_volunteers: false,
  allow_volunteer_applications: false,
  required_skill_ids: [],
};

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.75 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(34, 211, 238, 0.12)',
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
    </Box>
  );
}

function toDateOnly(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

export function CreateMissionDialog({
  open,
  onClose,
  mission,
  defaultDisasterId,
}: CreateMissionDialogProps) {
  const { t } = useTranslation('missions');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const [form, setForm] = useState<CreateMissionRequest>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = Boolean(mission?.id);

  const { data: disastersData } = useQuery({
    queryKey: ['disasters'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Disaster>>(endpoints.disasters.list);
      return data;
    },
    enabled: open,
  });

  const { data: coordinatorsData } = useQuery({
    queryKey: ['accounts-users', 'coordinators'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<CoordinatorOption>>(
        `${endpoints.accounts.users}?page_size=100`,
      );
      return data;
    },
    enabled: open && isAdmin,
  });

  const disasters = disastersData?.results ?? [];
  const coordinators = useMemo(
    () =>
      (coordinatorsData?.results ?? []).filter((user) =>
        user.roles.some((role) => role === 'admin' || role === 'coordinator'),
      ),
    [coordinatorsData?.results],
  );
  const selectedDisaster = useMemo(
    () => disasters.find((item) => item.id === form.disaster) ?? null,
    [disasters, form.disaster],
  );
  const selectedCoordinator = useMemo(
    () => coordinators.find((user) => user.id === form.coordinator) ?? null,
    [coordinators, form.coordinator],
  );

  useEffect(() => {
    if (!open) return;
    if (!mission) {
      const disaster = defaultDisasterId
        ? disasters.find((item) => item.id === defaultDisasterId)
        : null;
      setForm({
        ...initialForm,
        disaster: defaultDisasterId ?? '',
        province: disaster?.province ?? '',
        city: disaster?.city ?? '',
        location: disaster?.location ?? '',
      });
      setError(null);
      return;
    }

    setForm({
      disaster: mission.disaster,
      title: mission.title,
      description: mission.description ?? '',
      priority: mission.priority,
      province: mission.province ?? '',
      city: mission.city ?? '',
      location: mission.location ?? '',
      start_time: toDateOnly(mission.start_time),
      end_time: toDateOnly(mission.end_time),
      is_end_time_tba: mission.is_end_time_tba ?? false,
      required_volunteers: mission.required_volunteers,
      special_considerations: mission.special_considerations ?? '',
      equipment_needed: mission.equipment_needed ?? '',
      safety_notes: mission.safety_notes ?? '',
      is_visible_to_volunteers: mission.is_visible_to_volunteers,
      allow_volunteer_applications: mission.allow_volunteer_applications,
      required_skill_ids: mission.required_skills?.map((item) => item.skill_id) ?? [],
      coordinator: mission.coordinator,
    });
    setError(null);
  }, [open, mission, defaultDisasterId, disasters]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: CreateMissionRequest) => {
      const body = {
        ...payload,
        start_time: payload.start_time ? `${payload.start_time}T08:00:00` : null,
        end_time: payload.is_end_time_tba || !payload.end_time ? null : `${payload.end_time}T20:00:00`,
        is_end_time_tba: payload.is_end_time_tba ?? false,
      };
      const { data } = isEditMode
        ? await apiClient.patch<Mission>(endpoints.missions.detail(mission!.id), body)
        : await apiClient.post<Mission>(endpoints.missions.list, body);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]);
      onClose();
    },
    onError: (mutationError) => {
      setError(
        getApiErrorMessage(
          mutationError,
          isEditMode ? t('messages.updateError') : t('messages.createError'),
        ),
      );
    },
  });

  const handleChange = <K extends keyof CreateMissionRequest>(
    field: K,
    value: CreateMissionRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDisasterChange = (disaster: Disaster | null) => {
    handleChange('disaster', disaster?.id ?? '');
    if (disaster && !isEditMode) {
      setForm((prev) => ({
        ...prev,
        disaster: disaster.id,
        province: disaster.province ?? prev.province,
        city: disaster.city ?? prev.city,
        location: disaster.location ?? prev.location,
      }));
    }
  };

  const handleClose = () => {
    if (!upsertMutation.isPending) onClose();
  };

  const handleSubmit = () => {
    setError(null);
    if (!form.title.trim() || !form.disaster) {
      setError(t('messages.requiredFields'));
      return;
    }
    if (form.allow_volunteer_applications && !form.is_visible_to_volunteers) {
      setError(t('messages.visibilityConflict'));
      return;
    }

    upsertMutation.mutate({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() ?? '',
      province: form.province?.trim() ?? '',
      city: form.city?.trim() ?? '',
      location: form.location?.trim() ?? '',
      special_considerations: form.special_considerations?.trim() ?? '',
      equipment_needed: form.equipment_needed?.trim() ?? '',
      safety_notes: form.safety_notes?.trim() ?? '',
      required_volunteers: form.required_volunteers ?? 1,
      required_skill_ids: form.required_skill_ids ?? [],
      ...(isAdmin && form.coordinator ? { coordinator: form.coordinator } : {}),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          m: { xs: fullScreen ? 0 : 1.5, sm: 2 },
          width: { xs: fullScreen ? '100%' : 'calc(100% - 24px)', sm: undefined },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {isEditMode ? t('actions.edit') : t('create')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormSection title={t('sections.basic')} icon={<AssignmentOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={disasters}
                  value={selectedDisaster}
                  onChange={(_, value) => handleDisasterChange(value)}
                  getOptionLabel={(option) => option.title}
                  renderInput={(params) => (
                    <TextField {...params} label={t('fields.disaster')} size="small" required />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('fields.title')}
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label={t('fields.priority')}
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value as MissionPriority)}
                  fullWidth
                  size="small"
                >
                  {PRIORITIES.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {t(`priority.${priority}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label={t('fields.requiredVolunteers')}
                  value={form.required_volunteers ?? 1}
                  onChange={(e) =>
                    handleChange('required_volunteers', Math.max(1, Number(e.target.value) || 1))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              {isAdmin && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={coordinators}
                    value={selectedCoordinator}
                    onChange={(_, value) => handleChange('coordinator', value?.id)}
                    getOptionLabel={getCoordinatorLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.coordinator')}
                        size="small"
                        helperText={t('hints.coordinator')}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <JalaliDateField
                  label={t('fields.startDate')}
                  value={form.start_time ?? null}
                  onChange={(value) => handleChange('start_time', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <JalaliDateField
                    label={t('fields.endDate')}
                    value={form.is_end_time_tba ? null : (form.end_time ?? null)}
                    onChange={(value) => handleChange('end_time', value)}
                    disabled={form.is_end_time_tba}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.is_end_time_tba ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            is_end_time_tba: checked,
                            end_time: checked ? null : prev.end_time,
                          }));
                        }}
                      />
                    }
                    label={t('fields.endDateTba')}
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('fields.description')}
                  value={form.description ?? ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={4}
                  placeholder={t('placeholders.missionDetail')}
                  helperText={t('hints.missionDetail')}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('sections.location')} icon={<LocationOnOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('fields.province')}
                  value={form.province ?? ''}
                  onChange={(e) => handleChange('province', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('fields.city')}
                  value={form.city ?? ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('fields.location')}
                  value={form.location ?? ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('sections.requirements')} icon={<MedicalServicesOutlinedIcon fontSize="small" />}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <SkillsMultiSelect
                  enabled={open}
                  label={t('fields.requiredSkills')}
                  valueIds={form.required_skill_ids ?? []}
                  onChange={(skills) =>
                    handleChange('required_skill_ids', skills.map((item) => item.id))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('fields.specialConsiderations')}
                  value={form.special_considerations ?? ''}
                  onChange={(e) => handleChange('special_considerations', e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  helperText={t('hints.specialConsiderations')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('fields.equipmentNeeded')}
                  value={form.equipment_needed ?? ''}
                  onChange={(e) => handleChange('equipment_needed', e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  helperText={t('hints.equipmentNeeded')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('fields.safetyNotes')}
                  value={form.safety_notes ?? ''}
                  onChange={(e) => handleChange('safety_notes', e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  helperText={t('hints.safetyNotes')}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title={t('sections.visibility')} icon={<CrisisAlertOutlinedIcon fontSize="small" />}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_visible_to_volunteers ?? false}
                    onChange={(e) => {
                      const visible = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        is_visible_to_volunteers: visible,
                        allow_volunteer_applications: visible
                          ? prev.allow_volunteer_applications
                          : false,
                      }));
                    }}
                  />
                }
                label={t('fields.visibleToVolunteers')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allow_volunteer_applications ?? false}
                    disabled={!form.is_visible_to_volunteers}
                    onChange={(e) =>
                      handleChange('allow_volunteer_applications', e.target.checked)
                    }
                  />
                }
                label={t('fields.allowApplications')}
              />
              <Typography variant="caption" color="text.secondary">
                {t('hints.visibility')}
              </Typography>
            </Stack>
          </FormSection>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
          <GradientButton
            fullWidth
            onClick={handleSubmit}
            disabled={upsertMutation.isPending || !form.title.trim() || !form.disaster}
          >
            {upsertMutation.isPending ? '...' : isEditMode ? t('actions.save') : t('actions.create')}
          </GradientButton>
          <GhostButton onClick={handleClose} disabled={upsertMutation.isPending} sx={{ minWidth: 100 }}>
            {t('actions.cancel', { ns: 'common' })}
          </GhostButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
