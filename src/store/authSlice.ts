import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, tokenStorage, extractErrorMessage } from '@/api';
import type { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialised: boolean;
}

const initialState: AuthState = {
  user: tokenStorage.getUser(),
  isAuthenticated: tokenStorage.isAuthenticated(),
  loading: false,
  error: null,
  initialised: false,
};

// ==================== THUNKS ====================

export const login = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.login(payload);
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      tokenStorage.setUser(data.user);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Login failed.'));
    }
  },
);

export const register = createAsyncThunk<User, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Registration failed.'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logout({ refreshToken });
    } catch {
      // Server-side revocation is best-effort; always clear locally
    }
  }
  tokenStorage.clear();
});

export const loadCurrentUser = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/loadCurrentUser',
  async (_, { rejectWithValue }) => {
    if (!tokenStorage.getAccessToken()) return null;
    try {
      const user = await authApi.me();
      tokenStorage.setUser(user);
      return user;
    } catch (error) {
      tokenStorage.clear();
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const changePassword = createAsyncThunk<void, ChangePasswordRequest, { rejectValue: string }>(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      await authApi.changePassword(payload);
      tokenStorage.clear();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Password change failed.'));
    }
  },
);

// ==================== SLICE ====================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      tokenStorage.setUser(action.payload);
    },
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      tokenStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- login ----
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed.';
        state.isAuthenticated = false;
      })

      // ---- register ----
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Registration failed.';
      })

      // ---- logout ----
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      // ---- bootstrap ----
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialised = true;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.loading = false;
        state.initialised = true;
        state.user = null;
        state.isAuthenticated = false;
      })

      // ---- change password ----
      .addCase(changePassword.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser, forceLogout } = authSlice.actions;
export default authSlice.reducer;