import Stream   from '../models/stream.model.js';
import User     from '../models/user.model.js';
import Vod      from "../models/Vod.js";
import { generateAgoraToken }  from '../services/agora.service.js';
import { acquireResource, startRecording, stopRecording } from '../services/agoraRecording.service.js';
import { uploadVideoFromUrl }  from '../services/supabase.service.js';
import { queueTranscription }  from '../jobs/transcribeJob.js';
import { v4 as uuidv4 }        from 'uuid';

// ─── POST /api/streams/start ──────────────────────────────────
export const startStream = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const existingStream = await Stream.findOne({ streamerId: req.user._id, isLive: true });
    if (existingStream) return res.status(400).json({ message: 'You already have a live stream. Please end it before starting a new one.' });

    const agoraChannel = `stream_${uuidv4().slice(0, 8)}`;
    const uid          = Math.floor(Math.random() * 100000);
    const agoraToken   = generateAgoraToken(agoraChannel, uid, "publisher");

    // Create the stream DB record first (need channel name for recording)
    const stream = await Stream.create({
      streamerId:  req.user._id,
      title,
      description: description || '',
      category:    category || 'Other',
      tags:        tags || [],
      agoraChannel,
    });

    // ── Start Agora Cloud Recording (best-effort — don't fail the stream if it errors)
    try {
      const recordingUid = Math.floor(Math.random() * 100000);
      const recordToken  = generateAgoraToken(agoraChannel, recordingUid, "subscriber");

      const resourceId = await acquireResource(agoraChannel, recordingUid);
      const { sid }    = await startRecording(agoraChannel, recordingUid, resourceId, recordToken);

      // Save resourceId + sid + uid so we can stop recording later with the SAME uid
      await Stream.findByIdAndUpdate(stream._id, {
        agoraResourceId:   resourceId,
        agoraSid:          sid,
        agoraRecordingUid: recordingUid,   // ← must match exactly when stopping
      });
      console.log(`✅ Cloud recording started — sid: ${sid}, uid: ${recordingUid}`);
    } catch (recErr) {
      console.warn(`⚠️  Cloud recording failed to start (stream still live):`, recErr.message);
    }

    await User.findByIdAndUpdate(req.user._id, { isStreamer: true });

    res.status(201).json({
      success: true,
      message: 'Stream started successfully',
      stream: {
        id:           stream._id,
        title:        stream.title,
        category:     stream.category,
        tags:         stream.tags,
        agoraChannel: stream.agoraChannel,
        agoraToken,
        agoraAppId:   process.env.AGORA_APP_ID,
        uid,
        startedAt:    stream.startedAt,
      },
    });

  } catch (error) {
    console.error('startStream error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/streams ─────────────────────────────────────────
export const getAllStreams = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isLive: true };
    if (category && category !== 'ALL') filter.category = category;
    if (search) {
      filter.$or = [
        { title:    { $regex: search, $options: "i" } },
        { tags:     { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    const streams = await Stream.find(filter)
      .populate('streamerId', 'name avatar bio followersCount')
      .sort({ viewerCount: -1 })
      .lean();

    res.status(200).json({ success: true, count: streams.length, streams });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/streams/:id ─────────────────────────────────────
export const getStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate("streamerId", "name avatar bio followersCount isStreamer");

    if (!stream) return res.status(404).json({ success: false, message: "Stream not found" });

    if (!stream.isLive) {
      return res.status(400).json({ success: false, message: "Stream has ended", vodId: stream.vodId });
    }

    const uid        = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(stream.agoraChannel, uid, "subscriber");

    res.status(200).json({
      success: true,
      stream: {
        id:           stream._id,
        title:        stream.title,
        description:  stream.description,
        category:     stream.category,
        tags:         stream.tags,
        streamer:     stream.streamerId,
        viewerCount:  stream.viewerCount,
        startedAt:    stream.startedAt,
        chatEnabled:  stream.chatEnabled,
        agoraChannel: stream.agoraChannel,
        agoraToken,
        agoraAppId:   process.env.AGORA_APP_ID,
        uid,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── PUT /api/streams/:id/end ─────────────────────────────────
export const endStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream)                                                   return res.status(404).json({ success: false, message: "Stream not found" });
    if (stream.streamerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });
    if (!stream.isLive)                                            return res.status(400).json({ success: false, message: "Stream already ended" });

    const endedAt  = new Date();
    const duration = Math.floor((endedAt - stream.startedAt) / 1000);

    // ── Create VOD record first (always, even if recording fails)
    const vod = await Vod.create({
      streamerId:          stream.streamerId,
      streamId:            stream._id,
      title:               stream.title,
      description:         stream.description,
      category:            stream.category,
      tags:                stream.tags,
      duration,
      videoUrl:            "",
      transcriptionStatus: "pending",
    });

    // Mark stream as ended immediately so viewers get redirected
    await Stream.findByIdAndUpdate(stream._id, { isLive: false, endedAt, duration, vodId: vod._id });

    // Emit socket event to kick viewers
    const io = req.app.get("io");
    if (io) {
      io.to(`stream_${stream._id}`).emit("stream:ended", {
        message:  "Stream has ended",
        streamId: stream._id,
        vodId:    vod._id,
      });
    }

    // Respond immediately — don't make the streamer wait for recording upload
    res.status(200).json({ success: true, message: "Stream ended successfully", duration, vodId: vod._id });

    // ── Stop Agora recording & upload video in the background
    if (stream.agoraResourceId && stream.agoraSid) {
      setImmediate(async () => {
        try {
          console.log(`⏹  Stopping cloud recording for ${stream.agoraChannel} uid:${stream.agoraRecordingUid}…`);
          const fileList = await stopRecording(
            stream.agoraChannel,
            stream.agoraRecordingUid,   // ← same uid that was used during acquire/start
            stream.agoraResourceId,
            stream.agoraSid
          );

          console.log(`📁 Recording file list:`, fileList);

          // Find the .mp4 file
          const mp4 = Array.isArray(fileList)
            ? fileList.find(f => f.fileName?.endsWith('.mp4') || f.fileList?.endsWith?.('.mp4'))
            : null;

          if (!mp4) {
            console.warn(`⚠️  No mp4 in fileList for VOD ${vod._id}. fileList:`, fileList);
            // Mark as failed so the UI doesn't spin forever
            await Vod.findByIdAndUpdate(vod._id, { transcriptionStatus: 'failed' });
            return;
          }

          // Build Agora file URL: they write to your S3 bucket directly,
          // so construct the Supabase storage URL from the bucket path
          const supabaseStorageBase = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}`;
          const agoraFilePath = mp4.fileName || mp4.fileList;
          const videoUrl      = `${supabaseStorageBase}/${agoraFilePath}`;

          console.log(`📹 Video URL: ${videoUrl}`);

          // Save URL to VOD + queue transcription
          await Vod.findByIdAndUpdate(vod._id, { videoUrl });
          await queueTranscription(vod._id.toString(), videoUrl);

          console.log(`✅ VOD ${vod._id} video URL saved and transcription queued`);

        } catch (recErr) {
          console.error(`❌ Failed to stop recording / upload for VOD ${vod._id}:`, recErr.message);
          // Don't leave VOD stuck on "pending" — mark it so UI shows an error state
          await Vod.findByIdAndUpdate(vod._id, { transcriptionStatus: 'failed' });
        }
      });
    } else {
      console.warn(`⚠️  No Agora recording data on stream ${stream._id} — skipping recording stop`);
      // Mark VOD as failed immediately so UI doesn't spin forever
      await Vod.findByIdAndUpdate(vod._id, { transcriptionStatus: 'failed' });
    }

  } catch (error) {
    console.error("endStream error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/streams/my/active ──────────────────────────────
export const getMyActiveStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({ streamerId: req.user._id, isLive: true });
    if (!stream) return res.status(200).json({ success: true, stream: null, isLive: false });

    const uid        = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(stream.agoraChannel, uid, "publisher");

    res.status(200).json({
      success: true,
      isLive:  true,
      stream: {
        id:                stream._id,
        title:             stream.title,
        description:       stream.description,
        category:          stream.category,
        tags:              stream.tags,
        agoraChannel:      stream.agoraChannel,
        agoraToken,
        agoraAppId:        process.env.AGORA_APP_ID,
        uid,
        viewerCount:       stream.viewerCount,
        peakViewers:       stream.peakViewers,
        startedAt:         stream.startedAt,
        chatEnabled:       stream.chatEnabled,
        slowMode:          stream.slowMode,
        slowModeDelay:     stream.slowModeDelay,
        followersOnlyChat: stream.followersOnlyChat,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PATCH /api/streams/:id/update ───────────────────────────
export const updateStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: "Stream not found" });
    if (stream.streamerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const allowed = ["title", "description", "category", "tags",
                     "chatEnabled", "slowMode", "slowModeDelay", "followersOnlyChat", "thumbnailUrl"];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const updated = await Stream.findByIdAndUpdate(stream._id, updates, { new: true });
    res.status(200).json({ success: true, stream: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE /api/streams/:id ──────────────────────────────────
// Cascades: soft-deletes the linked VOD too
export const deleteStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: "Stream not found" });
    if (stream.streamerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Soft-delete any VOD linked to this stream
    if (stream.vodId) {
      await Vod.findByIdAndUpdate(stream.vodId, { isDeleted: true, isPublic: false });
    }

    await Stream.findByIdAndDelete(stream._id);
    res.status(200).json({ success: true, message: "Stream and linked VOD deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};