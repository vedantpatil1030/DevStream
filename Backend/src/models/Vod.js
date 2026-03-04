// server/models/Vod.js

import mongoose from "mongoose";

const transcriptChunkSchema = new mongoose.Schema({
  start:     { type: Number, required: true },  // seconds e.g. 125.4
  end:       { type: Number, required: true },  // seconds e.g. 130.2
  text:      { type: String, required: true },
  embedding: { type: [Number], default: [] },   // Gemini embedding vector
}, { _id: false });

const vodSchema = new mongoose.Schema(
  {
    // Ownership
    streamerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
    },

    // Content
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    category:    { type: String, default: "Other" },
    tags:        { type: [String], default: [] },

    // Video
    videoUrl:         { type: String, default: "" },  // Supabase public URL
    videoStoragePath: { type: String, default: "" },  // Supabase storage path for signed URLs
    thumbnailUrl:     { type: String, default: "" },
    duration:         { type: Number, default: 0 },   // seconds
    fileSize:         { type: Number, default: 0 },   // bytes

    // Agora Recording
    agoraResourceId: { type: String, default: "" },
    agoraSid:        { type: String, default: "" },

    // Stats
    views:         { type: Number, default: 0 },

    // AI Transcription
    transcriptionStatus: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
    transcribedAt: { type: Date, default: null },
    transcript:    { type: [transcriptChunkSchema], default: [] },

    // Visibility
    isPublic:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast queries
vodSchema.index({ streamerId: 1 });
vodSchema.index({ isPublic: 1, createdAt: -1 });
vodSchema.index({ transcriptionStatus: 1 });

const Vod = mongoose.model("Vod", vodSchema);
export default Vod;