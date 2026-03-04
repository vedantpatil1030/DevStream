import express from 'express';
import {
  startStream,
  getAllStreams,
  getStream,
  endStream,
  getMyActiveStream,
  updateStream,
  deleteStream,
} from "../controllers/stream.controller.js";
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public
router.get("/",           getAllStreams);
router.get("/:id",        getStream);

// Protected
router.post("/start",        requireAuth, startStream);
router.put("/:id/end",       requireAuth, endStream);
router.get("/my/active",     requireAuth, getMyActiveStream);
router.patch("/:id/update",  requireAuth, updateStream);
router.delete("/:id",        requireAuth, deleteStream);   // ← cascades to VOD

export default router;