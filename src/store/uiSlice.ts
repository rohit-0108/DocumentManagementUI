import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: (localStorage.getItem('dps_theme') as 'light' | 'dark') ?? 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('dps_theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;