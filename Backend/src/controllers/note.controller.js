// server/controllers/note.controller.js

import Note from "../models/Note.js";
import Vod  from "../models/Vod.js";

// ─── GET ALL NOTES FOR A VOD ──────────────────────────────────
// GET /api/notes/:vodId
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      vodId:     req.params.vodId,
      isDeleted: false,
    })
      .populate("authorId", "username avatar")
      .sort({ timestamp: 1 })   // sort by timestamp (table of contents order)
      .lean();

    res.status(200).json({
      success: true,
      notes,
      count: notes.length,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CREATE NOTE ──────────────────────────────────────────────
// POST /api/notes/:vodId
export const createNote = async (req, res) => {
  try {
    const { timestamp, content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    if (timestamp === undefined || timestamp < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid timestamp is required",
      });
    }

    // Check VOD exists
    const vod = await Vod.findById(req.params.vodId);
    if (!vod) {
      return res.status(404).json({
        success: false,
        message: "VOD not found",
      });
    }

    const note = await Note.create({
      vodId:     req.params.vodId,
      authorId:  req.user._id,
      timestamp: Math.floor(timestamp),
      content:   content.trim(),
    });

    // Populate author before returning
    await note.populate("authorId", "username avatar");

    res.status(201).json({
      success: true,
      message: "Note added",
      note,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPVOTE NOTE ──────────────────────────────────────────────
// PUT /api/notes/:noteId/upvote
export const upvoteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const alreadyUpvoted = note.upvotes.includes(req.user._id);

    if (alreadyUpvoted) {
      // Remove upvote
      await Note.findByIdAndUpdate(note._id, {
        $pull: { upvotes: req.user._id },
        $inc:  { upvoteCount: -1 },
      });

      return res.status(200).json({
        success: true,
        upvoted: false,
        upvoteCount: note.upvoteCount - 1,
      });

    } else {
      // Add upvote
      await Note.findByIdAndUpdate(note._id, {
        $addToSet: { upvotes: req.user._id },
        $inc:      { upvoteCount: 1 },
      });

      return res.status(200).json({
        success: true,
        upvoted: true,
        upvoteCount: note.upvoteCount + 1,
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE NOTE ──────────────────────────────────────────────
// DELETE /api/notes/:noteId
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Only author can delete their own note
    if (note.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Note.findByIdAndUpdate(note._id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Note deleted",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};