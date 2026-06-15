import { createSlice } from '@reduxjs/toolkit';

/**
 * UI SLICE
 * 
 * Why this slice exists:
 * - Manages cross-cutting presentational states like the theme (light/dark) and responsive sidebar overlays.
 * - Centralizes loading status controls for asynchronous operations (e.g. initial connection loader).
 * 
 * Why store UI state in Redux:
 * - Sidebar triggers are located in deep subcomponents (e.g. ChatHeader on mobile) but control the layout shell.
 * - Keeping theme preference in Redux makes theme-switching logic easily accessible to all components and styles.
 */

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return 'dark';
};

const initialState = {
  sidebarOpen: true, // Whether the sidebar is shown (especially important for mobile responsive view)
  theme: getInitialTheme(), // 'light' or 'dark'
  loading: false, // Global page loader (e.g., while waiting for WebSocket handshake)
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      localStorage.setItem('theme', nextTheme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setGlobalLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleTheme, setTheme, setGlobalLoading } = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectTheme = (state) => state.ui.theme;
export const selectGlobalLoading = (state) => state.ui.loading;

export default uiSlice.reducer;
