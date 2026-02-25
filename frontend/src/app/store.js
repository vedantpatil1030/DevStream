// src/app/store.js

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners }  from "@reduxjs/toolkit/query";
import authReducer          from "../features/auth/authSlice";
import chatReducer          from "../features/chat/chatSlice";
import streamReducer        from "../features/stream/streamSlice";
import { authApi }          from "../features/auth/authApi";
import { streamApi }        from "../features/stream/streamApi";
import { userApi }          from "../features/user/userApi";

export const store = configureStore({
  reducer: {
    auth:   authReducer,
    chat:   chatReducer,
    stream: streamReducer,

    // RTK Query reducers
    [authApi.reducerPath]:   authApi.reducer,
    [streamApi.reducerPath]: streamApi.reducer,
    [userApi.reducerPath]:   userApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      streamApi.middleware,
      userApi.middleware,
    ),
});

// Enable refetchOnFocus / refetchOnReconnect
setupListeners(store.dispatch);

export default store;