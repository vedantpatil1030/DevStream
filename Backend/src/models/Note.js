// server/models/Note.js

import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    vodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vod",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Content
    timestamp: {
      type: Number,
      required: true,   // seconds into video e.g. 754 = 12:34
    },
    content: {
      type: String,
      required: true,
      maxlength: [280, "Note cannot exceed 280 characters"],
    },

    // Engagement
    upvotes:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    upvoteCount:  { type: Number, default: 0 },
    isPinned:     { type: Boolean, default: false },

    // Moderation
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index — get all notes for a VOD sorted by timestamp
noteSchema.index({ vodId: 1, timestamp: 1 });
noteSchema.index({ vodId: 1, upvoteCount: -1 });

const Note = mongoose.model("Note", noteSchema);
export default Note;