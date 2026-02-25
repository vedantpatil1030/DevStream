// src/features/chat/chatSlice.js

import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages:    [],
    viewerCount: 0,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      // keep last 100 messages only
      if (state.messages.length > 100) {
        state.messages = state.messages.slice(-100);
      }
    },
    setViewerCount: (state, action) => {
      state.viewerCount = action.payload;
    },
    clearChat: (state) => {
      state.messages    = [];
      state.viewerCount = 0;
    },
  },
});

export const { addMessage, setViewerCount, clearChat } = chatSlice.actions;
export default chatSlice.reducer;

export const selectMessages    = (state) => state.chat.messages;
export const selectViewerCount = (state) => state.chat.viewerCount;