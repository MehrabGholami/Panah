import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { toggleThemeMode } from '@/app/slices/uiPreferencesSlice';

export function ThemeToggle() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.uiPreferences.themeMode);
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? t('theme.light') : t('theme.dark')}>
      <IconButton
        onClick={() => dispatch(toggleThemeMode())}
        aria-label={isDark ? t('theme.light') : t('theme.dark')}
        color="inherit"
        size="small"
      >
        {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
