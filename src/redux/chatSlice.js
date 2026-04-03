import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messagesByChatId: {}, // mapping: { [chatId]: [message1, message2, ...] }
  clearedAtByChatId: {}, // mapping: { [chatId]: timestampMillis }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      state.messagesByChatId[chatId] = messages;
    },
    setClearedAt: (state, action) => {
      const { chatId, clearedAtMillis } = action.payload;
      state.clearedAtByChatId[chatId] = clearedAtMillis;
    },
    clearChatMessages: (state, action) => {
      const { chatId } = action.payload;
      state.messagesByChatId[chatId] = [];
    }
  },
});

export const { setMessages, setClearedAt, clearChatMessages } = chatSlice.actions;
export default chatSlice.reducer;
