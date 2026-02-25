// src/features/auth/authApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/auth",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),

  tagTypes: ["Me"],

  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
    }),

    // GET /api/auth/getme — protected, returns { user }
    getMe: builder.query({
      query: () => ({
        url: "/getme",
        method: "GET",
      }),
      providesTags: ["Me"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
} = authApi;

// ── Helper: fetch user profile with a given token ─────────────────────────────
// Used right after login/register since RTK Query cache may not have the token yet.
export async function fetchCurrentUser(token) {
  try {
    const base = import.meta.env.VITE_API_URL;          // e.g. http://localhost:5000/api
    const res  = await fetch(`${base}/auth/getme`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}