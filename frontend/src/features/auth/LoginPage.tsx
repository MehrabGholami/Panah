import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { clearAuthError, login } from '@/app/slices/authSlice';
import { LoginProfileInviteCard } from '@/features/auth/components/LoginProfileInviteCard';
import { GradientButton, PillBadge } from '@/shared/components/ui';
import { isVolunteerProfileIncomplete, getPostLoginPath } from '@/shared/utils/profileCompletion';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const registered = Boolean((location.state as { registered?: boolean })?.registered);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearAuthError());
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      const user = result.payload.user;
      const destination = getPostLoginPath(user, from);
      if (isVolunteerProfileIncomplete(user)) {
        navigate(destination, { replace: true, state: { completeProfileInvite: true } });
        return;
      }
      navigate(destination, { replace: true });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 1.5 }}>
        <PillBadge label={t('login.badge')} />
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
          {t('login.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {t('login.subtitle')}
        </Typography>
      </Stack>

      {registered && (
        <Alert severity="success" sx={{ mb: 1 }}>
          {t('register.success')}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {t('login.error')}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label={t('login.email')}
          type="email"
          size="small"
          fullWidth
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email ? t('validation.email') : undefined}
          {...register('email')}
        />
        <TextField
          label={t('login.password')}
          type="password"
          size="small"
          fullWidth
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password ? t('validation.minPassword') : undefined}
          {...register('password')}
        />
        <GradientButton type="submit" fullWidth disabled={isLoading} sx={{ py: 1.0 }}>
          {isLoading ? t('actions.loading', { ns: 'common' }) : t('login.submit')}
        </GradientButton>
      </Stack>

      <LoginProfileInviteCard />

      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Divider sx={{ my: 1.25 }} />

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('login.noAccount')}{' '}
          <Link component={RouterLink} to="/register" underline="hover" color="primary" fontWeight={600}>
            {t('login.registerLink')}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
