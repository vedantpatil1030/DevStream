// src/features/stream/streamApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const streamApi = createApi({
  reducerPath: "streamApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/streams",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),

  tagTypes: ["Stream"],

  endpoints: (builder) => ({
    getAllStreams: builder.query({
      query: ({ category, search } = {}) => {
        const params = new URLSearchParams();
        if (category && category !== "All") params.append("category", category);
        if (search) params.append("search", search);
        return `?${params.toString()}`;
      },
      providesTags: ["Stream"],
    }),

    getStream: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Stream"],
    }),

    startStream: builder.mutation({
      query: (body) => ({
        url: "/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stream"],
    }),

    endStream: builder.mutation({
      query: (id) => ({
        url: `/${id}/end`,
        method: "PUT",
      }),
      invalidatesTags: ["Stream"],
    }),

    getMyActiveStream: builder.query({
      query: () => "/my/active",
    }),
  }),
});

export const {
  useGetAllStreamsQuery,
  useGetStreamQuery,
  useStartStreamMutation,
  useEndStreamMutation,
  useGetMyActiveStreamQuery,
} = streamApi;