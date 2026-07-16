import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'vmp_theme_mode';

function loadThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export interface UiPreferencesState {
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
}

const initialState: UiPreferencesState = {
  themeMode: loadThemeMode(),
  sidebarCollapsed: false,
};

const uiPreferencesSlice = createSlice({
  name: 'uiPreferences',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      localStorage.setItem(THEME_STORAGE_KEY, action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleThemeMode(state) {
      const next = state.themeMode === 'dark' ? 'light' : 'dark';
      state.themeMode = next;
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setThemeMode, toggleThemeMode, toggleSidebar, setSidebarCollapsed } =
  uiPreferencesSlice.actions;
export default uiPreferencesSlice.reducer;
