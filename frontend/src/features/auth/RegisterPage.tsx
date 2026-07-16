import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Box,
  Divider,
  Link,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { clearAuthError, register } from '@/app/slices/authSlice';
import { RegisterProfileInviteCard } from '@/features/auth/components/RegisterProfileInviteCard';
import { GhostButton, GradientButton, PillBadge, SkillsMultiSelect } from '@/shared/components/ui';
import type { Skill } from '@/shared/types';

const accountSchema = z
  .object({
    email: z.string().email(),
    national_id: z.string().min(10),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    phone: z.string().min(10),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'password_mismatch',
    path: ['confirmPassword'],
  });

const profileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  city: z.string().optional(),
  bio: z.string().optional(),
});

const skillsSchema = z.object({
  skill_names: z.array(z.string().min(2)),
  custom_skill_names: z.array(z.string().min(2)),
});

type AccountForm = z.infer<typeof accountSchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type SkillsForm = z.infer<typeof skillsSchema>;

const STEPS = ['account', 'profile', 'skills', 'review'] as const;

type GeoProvince = { id: number; name: string; slug: string };
type GeoCity = { id: number; name: string; slug: string; province_id: number };

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [accountData, setAccountData] = useState<AccountForm | null>(null);
  const [profileData, setProfileData] = useState<ProfileForm | null>(null);
  const [skillsData, setSkillsData] = useState<SkillsForm | null>(null);

  const accountForm = useForm<AccountForm>({ resolver: zodResolver(accountSchema) });
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const skillsForm = useForm<SkillsForm>({
    resolver: zodResolver(skillsSchema),
    defaultValues: { skill_names: [], custom_skill_names: [] },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const normalizeCustomSkills = (values: string[]) =>
    values
      .map((value) => value.trim())
      .filter((value, index, items) => value.length >= 2 && items.indexOf(value) === index);

  useEffect(() => {
    if (activeStep !== 1) return;
    if (provinces.length > 0 && cities.length > 0) return;

    const loadGeo = async () => {
      setGeoLoading(true);
      try {
        const [provRes, citiesRes] = await Promise.all([
          fetch('https://cdn.jsdelivr.net/npm/iran-city@1.2.2/dist/list-of-cities-in-Iran/json/provinces.json'),
          fetch('https://cdn.jsdelivr.net/npm/iran-city@1.2.2/dist/list-of-cities-in-Iran/json/cities.json'),
        ]);

        const provJson = (await provRes.json()) as GeoProvince[];
        const cityJson = (await citiesRes.json()) as GeoCity[];

        setProvinces(provJson);
        setCities(cityJson);
      } finally {
        setGeoLoading(false);
      }
    };

    void loadGeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, provinces.length, cities.length]);

  const citiesForSelectedProvince = useMemo(() => {
    if (!selectedProvinceId) return [];
    return cities.filter((c) => c.province_id === selectedProvinceId);
  }, [cities, selectedProvinceId]);

  const handleAccountNext = accountForm.handleSubmit((data) => {
    setAccountData(data);
    setActiveStep(1);
  });

  const handleProfileNext = profileForm.handleSubmit((data) => {
    setProfileData(data);
    setActiveStep(2);
  });

  const handleSkillsNext = skillsForm.handleSubmit(() => {
    const standardNames = selectedSkills.map((skill) => skill.name);
    const customNames = normalizeCustomSkills(customSkills);

    if (standardNames.length === 0 && customNames.length === 0) {
      skillsForm.setError('skill_names', { type: 'manual', message: 'required' });
      return;
    }

    setSkillsData({ skill_names: standardNames, custom_skill_names: customNames });
    setActiveStep(3);
  });

  const handleSubmit = async () => {
    if (!accountData || !profileData || !skillsData) return;
    dispatch(clearAuthError());
    const result = await dispatch(
      register({
        email: accountData.email,
        password: accountData.password,
        national_id: accountData.national_id,
        phone: accountData.phone,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        city: profileData.city,
        bio: profileData.bio,
        skill_names: skillsData.skill_names,
        custom_skill_names: skillsData.custom_skill_names,
      }),
    );
    if (register.fulfilled.match(result)) {
      navigate('/login', { state: { registered: true } });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={1.75} alignItems="center" textAlign="center" sx={{ mb: 1.5 }}>
        <PillBadge label={t('register.badge')} />
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
          {t('register.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {t('register.subtitle')}
        </Typography>
      </Stack>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        orientation="horizontal"
        sx={{
          mb: 1.25,
          '& .MuiStepLabel-label': { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
        }}
      >
        {STEPS.map((step) => (
          <Step key={step}>
            <StepLabel>{t(`register.steps.${step}`)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {t('register.error')}
        </Alert>
      )}

      {activeStep === 0 && (
        <Stack component="form" spacing={1.5} onSubmit={(e) => void handleAccountNext(e)}>
          <TextField
            label={t('register.email')}
            type="email"
            size="small"
            fullWidth
            error={Boolean(accountForm.formState.errors.email)}
            helperText={accountForm.formState.errors.email ? t('validation.email') : undefined}
            {...accountForm.register('email')}
          />
          <TextField
            label={t('register.nationalId')}
            size="small"
            fullWidth
            error={Boolean(accountForm.formState.errors.national_id)}
            helperText={accountForm.formState.errors.national_id ? t('validation.nationalId') : undefined}
            {...accountForm.register('national_id')}
          />
          <TextField
            label={t('register.phone')}
            size="small"
            fullWidth
            error={Boolean(accountForm.formState.errors.phone)}
            helperText={accountForm.formState.errors.phone ? t('validation.phone') : undefined}
            {...accountForm.register('phone')}
          />
          <TextField
            label={t('register.password')}
            type="password"
            size="small"
            fullWidth
            error={Boolean(accountForm.formState.errors.password)}
            helperText={accountForm.formState.errors.password ? t('validation.minPassword') : undefined}
            {...accountForm.register('password')}
          />
          <TextField
            label={t('register.confirmPassword')}
            type="password"
            size="small"
            fullWidth
            error={Boolean(accountForm.formState.errors.confirmPassword)}
            helperText={
              accountForm.formState.errors.confirmPassword
                ? t('register.passwordMismatch')
                : undefined
            }
            {...accountForm.register('confirmPassword')}
          />
          <GradientButton type="submit" fullWidth sx={{ py: 1 }}>
            {t('register.next')}
          </GradientButton>
        </Stack>
      )}

      {activeStep === 1 && (
        <Stack component="form" spacing={1.5} onSubmit={(e) => void handleProfileNext(e)}>
          <TextField
            label={t('register.firstName')}
            size="small"
            fullWidth
            error={Boolean(profileForm.formState.errors.first_name)}
            {...profileForm.register('first_name')}
          />
          <TextField
            label={t('register.lastName')}
            size="small"
            fullWidth
            error={Boolean(profileForm.formState.errors.last_name)}
            {...profileForm.register('last_name')}
          />

          <Autocomplete
            options={provinces}
            loading={geoLoading}
            value={selectedProvinceId ? provinces.find((p) => p.id === selectedProvinceId) ?? null : null}
            onChange={(_, value) => {
              const nextProvinceId = value?.id ?? null;
              setSelectedProvinceId(nextProvinceId);
              setSelectedCityId(null);
              profileForm.setValue('city', '');
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label={t('register.province')} size="small" />
            )}
          />

          <Autocomplete
            disabled={!selectedProvinceId}
            options={citiesForSelectedProvince}
            loading={geoLoading}
            value={selectedCityId ? citiesForSelectedProvince.find((c) => c.id === selectedCityId) ?? null : null}
            onChange={(_, value) => {
              const nextCityId = value?.id ?? null;
              setSelectedCityId(nextCityId);
              profileForm.setValue('city', value?.name ?? '');
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label={t('register.city')} size="small" />
            )}
          />
          <TextField
            label={t('register.bio')}
            size="small"
            fullWidth
            multiline
            rows={2}
            {...profileForm.register('bio')}
          />
          <Stack direction="row" spacing={2}>
            <GhostButton fullWidth onClick={() => setActiveStep(0)}>
              {t('register.prev')}
            </GhostButton>
            <GradientButton type="submit" fullWidth sx={{ py: 1 }}>
              {t('register.next')}
            </GradientButton>
          </Stack>
        </Stack>
      )}

      {activeStep === 2 && (
        <Stack component="form" spacing={1.5} onSubmit={(e) => void handleSkillsNext(e)}>
          <Typography variant="body2" color="text.secondary">
            {t('register.skillsHint')}
          </Typography>

          <SkillsMultiSelect
            publicList
            label={t('register.skills')}
            value={selectedSkills}
            onChange={(skills) => {
              setSelectedSkills(skills);
              skillsForm.setValue('skill_names', skills.map((skill) => skill.name), {
                shouldValidate: true,
              });
              if (skills.length > 0 || customSkills.length > 0) {
                skillsForm.clearErrors('skill_names');
              }
            }}
            error={Boolean(skillsForm.formState.errors.skill_names)}
            helperText={
              skillsForm.formState.errors.skill_names ? t('validation.skills') : undefined
            }
          />

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={customSkills}
            onChange={(_, value) => {
              const next = normalizeCustomSkills(
                value.map((item) => (typeof item === 'string' ? item : item)),
              );
              setCustomSkills(next);
              skillsForm.setValue('custom_skill_names', next, { shouldValidate: true });
              if (next.length > 0 || selectedSkills.length > 0) {
                skillsForm.clearErrors('skill_names');
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('register.otherSkills')}
                size="small"
                helperText={t('register.customSkillsHint')}
              />
            )}
          />

          <Stack direction="row" spacing={2}>
            <GhostButton fullWidth onClick={() => setActiveStep(1)}>
              {t('register.prev')}
            </GhostButton>
            <GradientButton type="submit" fullWidth sx={{ py: 1 }}>
              {t('register.next')}
            </GradientButton>
          </Stack>
        </Stack>
      )}

      {activeStep === 3 && accountData && profileData && skillsData && (
        <Stack spacing={1.5}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('register.email')}:</strong> {accountData.email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('register.phone')}:</strong> {accountData.phone}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('register.firstName')}:</strong> {profileData.first_name}{' '}
              {profileData.last_name}
            </Typography>
            {profileData.city && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{t('register.city')}:</strong> {profileData.city}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mb: skillsData.custom_skill_names.length > 0 ? 1 : 0 }}>
              <strong>{t('register.skills')}:</strong>{' '}
              {skillsData.skill_names.length > 0 ? skillsData.skill_names.join('، ') : '—'}
            </Typography>
            {skillsData.custom_skill_names.length > 0 && (
              <Typography variant="body2">
                <strong>{t('register.otherSkills')}:</strong>{' '}
                {skillsData.custom_skill_names.join('، ')}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <GhostButton fullWidth onClick={() => setActiveStep(2)}>
              {t('register.prev')}
            </GhostButton>
            <GradientButton
              fullWidth
              disabled={isLoading}
              onClick={() => void handleSubmit()}
              sx={{ py: 1.1 }}
            >
              {isLoading ? t('actions.loading', { ns: 'common' }) : t('register.submit')}
            </GradientButton>
          </Stack>
          <RegisterProfileInviteCard />
        </Stack>
      )}

      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Divider sx={{ my: 1.25 }} />

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('register.hasAccount')}{' '}
          <Link component={RouterLink} to="/login" underline="hover" color="primary" fontWeight={600}>
            {t('register.loginLink')}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
