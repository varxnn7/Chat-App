import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contacts: [],
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload;
    },
  },
});

export const { setContacts } = usersSlice.actions;
export default usersSlice.reducer;
