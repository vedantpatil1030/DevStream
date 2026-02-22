import express from 'express';
import{
    startStream,
    getAllStreams,
    getStream,
    endStream,
    getMyActiveStream
}from "../controllers/stream.controller.js";
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
// Public
router.get("/",           getAllStreams);     // browse all live streams
router.get("/:id",        getStream);        // watch a stream

// Protected
router.post("/start",     requireAuth, startStream);       // go live
router.put("/:id/end",    requireAuth, endStream);         // end stream
router.get("/my/active",  requireAuth, getMyActiveStream); // am i live?

export default router;