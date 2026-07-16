import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient, clearStoredTokens, getStoredTokens, setStoredTokens } from '@/shared/api/axios';
import { endpoints } from '@/shared/api/endpoints';
import type { LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest, User } from '@/shared/types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<LoginResponse>(endpoints.auth.login, credentials);
      setStoredTokens({ access: data.access, refresh: data.refresh });
      return data;
    } catch {
      return rejectWithValue('login_failed');
    }
  },
);

export const register = createAsyncThunk<void, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      await apiClient.post(endpoints.volunteers.register, payload);
    } catch {
      return rejectWithValue('register_failed');
    }
  },
);

export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<User>(endpoints.auth.me);
      return data;
    } catch {
      clearStoredTokens();
      return rejectWithValue('session_expired');
    }
  },
);

export const updateProfile = createAsyncThunk<User, UpdateProfileRequest, { rejectValue: string }>(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<User>(endpoints.auth.me, payload);
      return data;
    } catch {
      return rejectWithValue('profile_update_failed');
    }
  },
);

export const uploadAvatar = createAsyncThunk<User, File, { rejectValue: string }>(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<User>(endpoints.auth.avatar, formData);
      return data;
    } catch {
      return rejectWithValue('avatar_upload_failed');
    }
  },
);

export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    const tokens = getStoredTokens();
    try {
      if (tokens?.refresh) {
        await apiClient.post(endpoints.auth.logout, { refresh: tokens.refresh });
      }
    } catch {
      // ignore logout errors
    } finally {
      clearStoredTokens();
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    setAuthInitialized(state) {
      state.isInitialized = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
        state.error = 'login_failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false;
        state.error = 'register_failed';
      })
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state) => {
        state.isLoading = false;
        state.error = 'profile_update_failed';
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state) => {
        state.isLoading = false;
        state.error = 'avatar_upload_failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearAuthError, setUser, setAuthInitialized } = authSlice.actions;
export default authSlice.reducer;
