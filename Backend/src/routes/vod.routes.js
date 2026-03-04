
// server/routes/vod.routes.js

import express from "express";
import multer  from "multer";
import {
  getAllVods,
  getVod,
  getMyVods,
  deleteVod,
  searchVod,
  setVideoUrl,
  fixOrphanedVods,
  uploadVodVideo,
  getVideoSignedUrl,
  retranscribeVod,
} from "../controllers/vod.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Accept up to 500 MB video blobs in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 500 * 1024 * 1024 },
});

router.get("/",              getAllVods);
router.get("/my",            requireAuth, getMyVods);
router.get("/fix-orphans",   requireAuth, fixOrphanedVods);
router.get("/:id",           getVod);
router.get("/:id/search",    requireAuth, searchVod);
router.get("/:id/video-url", getVideoSignedUrl);              // signed playback URL
router.patch("/:id/set-video",  requireAuth, setVideoUrl);
router.post("/:id/upload-video",   requireAuth, upload.single("video"), uploadVodVideo);
router.post("/:id/retranscribe",   requireAuth, retranscribeVod);        // re-queue failed transcription
router.delete("/:id",              requireAuth, deleteVod);

export default router;