// src/features/note/noteApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const noteApi = createApi({
  reducerPath: "noteApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/notes",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),

  tagTypes: ["Note"],

  endpoints: (builder) => ({
    getNotes: builder.query({
      query: (vodId) => `/${vodId}`,
      providesTags: ["Note"],
    }),

    createNote: builder.mutation({
      query: ({ vodId, timestamp, content }) => ({
        url:    `/${vodId}`,
        method: "POST",
        body:   { timestamp, content },
      }),
      invalidatesTags: ["Note"],
    }),

    upvoteNote: builder.mutation({
      query: (noteId) => ({
        url:    `/${noteId}/upvote`,
        method: "PUT",
      }),
      invalidatesTags: ["Note"],
    }),

    deleteNote: builder.mutation({
      query: (noteId) => ({
        url:    `/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Note"],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpvoteNoteMutation,
  useDeleteNoteMutation,
} = noteApi;