// src/features/auth/authSlice.js

import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");

// Get user from localStorage and ensure it has the correct field names
let user = null;
const storedUser = localStorage.getItem("user");
if (storedUser) {
  try {
    const parsed = JSON.parse(storedUser);
    // Ensure user has 'name' field (handle old data with 'username')
    if (!parsed.name && parsed.username) {
      parsed.name = parsed.username;
    }
    user = parsed;
  } catch {
    user = null;
  }
}

const initialState = {
  user,
  token,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      // Ensure user has 'name' field (normalize field names)
      if (user && !user.name && user.username) {
        user.name = user.username;
      }
      state.user            = user;
      state.token           = token;
      state.isAuthenticated = true;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser          = (state) => state.auth.user;
export const selectIsAuthenticated      = (state) => state.auth.isAuthenticated;
export const selectCurrentToken         = (state) => state.auth.token;