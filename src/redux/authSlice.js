import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  loading: true, // Used to defer rendering until auth state is known
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
    }
  },
});

export const { setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
