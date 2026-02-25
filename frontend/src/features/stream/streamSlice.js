// src/features/stream/streamSlice.js

import { createSlice } from "@reduxjs/toolkit";

const streamSlice = createSlice({
  name: "stream",
  initialState: {
    activeStream:  null,   // current stream being watched
    myLiveStream:  null,   // if user is currently streaming
    isLive:        false,
  },
  reducers: {
    setActiveStream: (state, action) => {
      state.activeStream = action.payload;
    },
    setMyLiveStream: (state, action) => {
      state.myLiveStream = action.payload;
      state.isLive       = !!action.payload;
    },
    clearActiveStream: (state) => {
      state.activeStream = null;
    },
    clearMyLiveStream: (state) => {
      state.myLiveStream = null;
      state.isLive       = false;
    },
  },
});

export const {
  setActiveStream,
  setMyLiveStream,
  clearActiveStream,
  clearMyLiveStream,
} = streamSlice.actions;

export default streamSlice.reducer;

export const selectActiveStream = (state) => state.stream.activeStream;
export const selectMyLiveStream = (state) => state.stream.myLiveStream;
export const selectIsLive       = (state) => state.stream.isLive;