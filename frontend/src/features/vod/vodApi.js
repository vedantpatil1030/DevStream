// src/features/vod/vodApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const vodApi = createApi({
  reducerPath: "vodApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/vods",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),

  tagTypes: ["Vod"],

  endpoints: (builder) => ({
    getAllVods: builder.query({
      query: ({ category, search, page } = {}) => {
        const params = new URLSearchParams();
        if (category && category !== "All") params.append("category", category);
        if (search)   params.append("search", search);
        if (page)     params.append("page", page);
        return `?${params.toString()}`;
      },
      providesTags: ["Vod"],
    }),

    getVod: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Vod"],
    }),

    getMyVods: builder.query({
      query: () => "/my",
      providesTags: ["Vod"],
    }),

    searchVod: builder.query({
      query: ({ id, q }) => `/${id}/search?q=${encodeURIComponent(q)}`,
    }),

    deleteVod: builder.mutation({
      query: (id) => ({
        url:    `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vod"],
    }),

    setVodVideoUrl: builder.mutation({
      query: ({ id, videoUrl }) => ({
        url:    `/${id}/set-video`,
        method: "PATCH",
        body:   { videoUrl },
      }),
      invalidatesTags: ["Vod"],
    }),
  }),
});

export const {
  useGetAllVodsQuery,
  useGetVodQuery,
  useGetMyVodsQuery,
  useLazySearchVodQuery,
  useDeleteVodMutation,
  useSetVodVideoUrlMutation,
} = vodApi;
