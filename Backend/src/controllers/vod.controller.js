// server/controllers/vod.controller.js

import Vod        from "../models/Vod.js";
import Stream     from "../models/stream.model.js";
import { createClient } from "@supabase/supabase-js";
import { searchTranscript }   from "../services/transcribe.service.js";
import { queueTranscription } from "../jobs/transcribeJob.js";

// ─── Lazy Supabase client ─────────────────────────────────────
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase not configured — add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env");
  _supabase = createClient(url, key);
  return _supabase;
}
const BUCKET = () => process.env.SUPABASE_BUCKET || "vods";


// ─── GET ALL VODS ─────────────────────────────────────────────
// GET /api/vods
export const getAllVods = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    const filter = { isPublic: true, isDeleted: false };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title:    { $regex: search, $options: "i" } },
        { tags:     { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [vods, total] = await Promise.all([
      Vod.find(filter)
        .populate("streamerId", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-transcript")    // exclude transcript (too heavy)
        .lean(),
      Vod.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      vods,
      pagination: {
        total,
        page:       Number(page),
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("getAllVods error:", error);
    res.status(500).json({ success: false, message: "Server error", detail: error.message });
  }
};

// ─── GET SINGLE VOD ───────────────────────────────────────────
// GET /api/vods/:id
export const getVod = async (req, res) => {
  try {
    const vod = await Vod.findOne({
      _id:       req.params.id,
      isDeleted: false,
    })
      .populate("streamerId", "username avatar bio followerCount")
      .select("-transcript.embedding");  // exclude vectors (huge arrays)

    if (!vod) {
      return res.status(404).json({
        success: false,
        message: "VOD not found",
      });
    }

    // Increment view count — fire and forget
    Vod.findByIdAndUpdate(vod._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, vod });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET VIDEO SIGNED URL ─────────────────────────────────────
// GET /api/vods/:id/video-url
// Returns a fresh 1-hour signed URL for private Supabase storage videos.
// The frontend calls this right before playing the video.
export const getVideoSignedUrl = async (req, res) => {
  try {
    const vod = await Vod.findOne({ _id: req.params.id, isDeleted: false })
      .select("videoUrl videoStoragePath streamerId transcriptionStatus");

    if (!vod) return res.status(404).json({ success: false, message: "VOD not found" });

    // Derive the storage path — either from stored field or reconstruct from id
    const storagePath = vod.videoStoragePath || `videos/vod_${vod._id}.mp4`;

    const sb = getSupabase();
    const { data, error } = await sb.storage
      .from(BUCKET())
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (error) {
      console.error("Error creating signed URL:", error.message);
      // Fall back to public URL if signed URL fails
      return res.status(200).json({ success: true, videoUrl: vod.videoUrl, signed: false });
    }

    res.status(200).json({ success: true, videoUrl: data.signedUrl, signed: true });
  } catch (error) {
    console.error("getVideoSignedUrl error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// ─── GET MY VODS ──────────────────────────────────────────────
// GET /api/vods/my
export const getMyVods = async (req, res) => {
  try {
    const vods = await Vod.find({
      streamerId: req.user._id,
      isDeleted:  false,
    })
      .sort({ createdAt: -1 })
      .select("-transcript")
      .lean();

    res.status(200).json({ success: true, vods });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE VOD ───────────────────────────────────────────────
// DELETE /api/vods/:id
export const deleteVod = async (req, res) => {
  try {
    const vod = await Vod.findById(req.params.id);

    if (!vod) {
      return res.status(404).json({
        success: false,
        message: "VOD not found",
      });
    }

    // Only owner can delete
    if (vod.streamerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Soft delete
    await Vod.findByIdAndUpdate(vod._id, {
      isDeleted: true,
      isPublic:  false,
    });

    res.status(200).json({
      success: true,
      message: "VOD deleted",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── AI SEARCH INSIDE VOD ─────────────────────────────────────
// GET /api/vods/:id/search?q=explain useEffect
export const searchVod = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const vod = await Vod.findById(req.params.id)
      .select("transcript transcriptionStatus title");

    if (!vod) {
      return res.status(404).json({
        success: false,
        message: "VOD not found",
      });
    }

    if (vod.transcriptionStatus !== "done") {
      return res.status(400).json({
        success: false,
        message: vod.transcriptionStatus === "pending"
          ? "Transcription not started yet"
          : vod.transcriptionStatus === "processing"
          ? "Transcription in progress, check back soon"
          : "Transcription failed for this VOD",
      });
    }

    if (vod.transcript.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No transcript available",
      });
    }

    // Search using cosine similarity
    const results = await searchTranscript(q, vod.transcript);

    res.status(200).json({
      success: true,
      query:   q,
      results: results.map((r) => ({
        start:      r.start,
        end:        r.end,
        text:       r.text,
        similarity: Math.round(r.similarity * 100),
      })),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PATCH /api/vods/:id/set-video ────────────────────────────
// Called by the frontend after uploading to Cloudinary
// Body: { videoUrl: "https://res.cloudinary.com/..." }
export const setVideoUrl = async (req, res) => {
  try {
    const vod = await Vod.findById(req.params.id);
    if (!vod) return res.status(404).json({ success: false, message: "VOD not found" });
    if (vod.streamerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ success: false, message: "videoUrl is required" });

    await Vod.findByIdAndUpdate(vod._id, { videoUrl, transcriptionStatus: "pending" });

    // Queue transcription now that we have a video URL
    await queueTranscription(vod._id.toString(), videoUrl);

    res.status(200).json({ success: true, message: "Video URL saved, transcription queued" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/vods/fix-orphans ────────────────────────────────
// Admin: soft-delete VODs whose parent Stream no longer exists,
// and mark stuck pending/processing VODs (no videoUrl) as failed.
export const fixOrphanedVods = async (req, res) => {
  try {
    // 1. Mark stuck VODs as failed
    const stuckResult = await Vod.updateMany(
      { videoUrl: { $in: ["", null] }, transcriptionStatus: { $in: ["pending", "processing"] } },
      { $set: { transcriptionStatus: "failed" } }
    );

    // 2. Orphaned VODs (stream deleted from Atlas directly)
    const allVods       = await Vod.find({ isDeleted: false }).select("streamId _id").lean();
    const streamIds     = [...new Set(allVods.map(v => v.streamId?.toString()).filter(Boolean))];
    const liveStreams   = await Stream.find({ _id: { $in: streamIds } }).select("_id").lean();
    const liveSet       = new Set(liveStreams.map(s => s._id.toString()));
    const orphanIds     = allVods.filter(v => v.streamId && !liveSet.has(v.streamId.toString())).map(v => v._id);

    let orphanCount = 0;
    if (orphanIds.length > 0) {
      const r = await Vod.updateMany({ _id: { $in: orphanIds } }, { $set: { isDeleted: true, isPublic: false } });
      orphanCount = r.modifiedCount;
    }

    res.status(200).json({
      success:  true,
      stuck:    stuckResult.modifiedCount,
      orphaned: orphanCount,
      message: `Fixed ${stuckResult.modifiedCount} stuck VODs and ${orphanCount} orphaned VODs`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", detail: error.message });
  }
};

// ─── POST /api/vods/:id/upload-video ──────────────────────────
// Receives a recorded video blob from the browser (via multer),
// uploads it to Supabase Storage, saves the URL, queues transcription.
export const uploadVodVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file received" });

    const vod = await Vod.findById(req.params.id);
    if (!vod) return res.status(404).json({ success: false, message: "VOD not found" });
    if (vod.streamerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const sizeMB = (req.file.size / 1024 / 1024).toFixed(1);
    console.log(`📤 Uploading VOD ${vod._id} to Supabase Storage (${sizeMB} MB)…`);

    const sb         = getSupabase();
    const filePath   = `videos/vod_${vod._id}.mp4`;

    // Determine content type from the browser recording (webm or mp4)
    const contentType = req.file.mimetype || "video/webm";

    // Upload the buffer directly to Supabase Storage
    const { error: uploadError } = await sb.storage
      .from(BUCKET())
      .upload(filePath, req.file.buffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,   // overwrite if a previous upload exists for the same VOD
      });

    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

    // Build the public URL
    const { data: urlData } = sb.storage.from(BUCKET()).getPublicUrl(filePath);
    const videoUrl = urlData.publicUrl;

    console.log(`✅ Supabase upload done: ${videoUrl}`);

    // Save URL, filePath, and queue transcription
    await Vod.findByIdAndUpdate(vod._id, {
      videoUrl,
      videoStoragePath: filePath,   // stored so we can generate signed URLs later
      transcriptionStatus: "pending",
    });
    // Pass only vodId — the job will generate a fresh signed URL at processing time
    await queueTranscription(vod._id.toString());

    res.status(200).json({ success: true, videoUrl, message: "Video uploaded to Supabase and transcription queued" });
  } catch (error) {
    console.error("uploadVodVideo error:", error);
    res.status(500).json({ success: false, message: error.message || "Upload failed" });
  }
};

// ─── POST /api/vods/:id/retranscribe ──────────────────────────
// Re-queues transcription for a VOD that previously failed or got stuck.
// Only the owner can trigger this. VOD must have a video file already.
export const retranscribeVod = async (req, res) => {
  try {
    const vod = await Vod.findOne({ _id: req.params.id, isDeleted: false });

    if (!vod) return res.status(404).json({ success: false, message: "VOD not found" });
    if (vod.streamerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Must have a video file to re-transcribe
    const storagePath = vod.videoStoragePath || `videos/vod_${vod._id}.mp4`;

    // Verify the file actually exists in Supabase before queuing
    const sb = getSupabase();
    const { data: fileList, error: listErr } = await sb.storage
      .from(BUCKET())
      .list("videos", { search: `vod_${vod._id}` });

    if (listErr || !fileList?.length) {
      return res.status(400).json({
        success: false,
        message: "No video file found in storage. Please re-upload the recording first.",
      });
    }

    // Reset transcript + status, then re-queue
    await Vod.findByIdAndUpdate(vod._id, {
      transcriptionStatus: "pending",
      transcript:          [],
      transcribedAt:       null,
      videoStoragePath:    storagePath,
    });

    await queueTranscription(vod._id.toString());

    console.log(`🔄 Retranscription queued for VOD: ${vod._id}`);
    res.status(200).json({ success: true, message: "Transcription re-queued successfully" });
  } catch (error) {
    console.error("retranscribeVod error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};