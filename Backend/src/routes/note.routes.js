// server/routes/note.routes.js

import express from "express";
import {
  getNotes,
  createNote,
  upvoteNote,
  deleteNote,
} from "../controllers/note.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:vodId",          getNotes);                   // public
router.post("/:vodId",         requireAuth, createNote);    // add note
router.put("/:noteId/upvote",  requireAuth, upvoteNote);    // upvote
router.delete("/:noteId",      requireAuth, deleteNote);    // delete

export default router;