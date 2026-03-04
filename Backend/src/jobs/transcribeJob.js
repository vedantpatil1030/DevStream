// server/jobs/transcribeJob.js

import Bull           from "bull";
import Vod            from "../models/Vod.js";
import { createClient } from "@supabase/supabase-js";
import { transcribeVideo, generateEmbeddings } from "../services/transcribe.service.js";

// Create queue — uses Redis (Upstash via TLS)
const redisUrl = new URL(process.env.REDIS_URL);
const transcribeQueue = new Bull("transcribe", {
  redis: {
    host:     redisUrl.hostname,
    port:     Number(redisUrl.port) || 6379,
    password: redisUrl.password,
    username: redisUrl.username || "default",
    tls:      {},   // required for Upstash (TLS/SSL)
  },
});

// ─── Lazy Supabase client ─────────────────────────────────────
let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  _sb = createClient(url, key);
  return _sb;
}
const BUCKET = () => process.env.SUPABASE_BUCKET || "vods";

// ─── ADD JOB TO QUEUE ─────────────────────────────────────────
// Pass filePath (e.g. "videos/vod_<id>.mp4") so the worker can generate
// a fresh signed URL at transcription time — avoids "Bad Request" from
// trying to fetch a private/unauthenticated public URL.
export const queueTranscription = async (vodId, _videoUrlOrFilePath) => {
  // Derive the storage filePath from vodId — it's always the same pattern
  const filePath = `videos/vod_${vodId}.mp4`;
  await transcribeQueue.add(
    { vodId, filePath },
    {
      attempts: 3,
      backoff:  { type: "exponential", delay: 5000 },
      removeOnComplete: true,
    }
  );
  console.log(`✅ Transcription queued for VOD: ${vodId} (path: ${filePath})`);
};

// ─── PROCESS JOBS ─────────────────────────────────────────────
transcribeQueue.process(async (job) => {
  const { vodId, filePath } = job.data;

  console.log(`🎙️ Starting transcription for VOD: ${vodId}`);

  // 1. Mark as processing
  await Vod.findByIdAndUpdate(vodId, { transcriptionStatus: "processing" });

  try {
    // 2. Generate a fresh signed URL (valid 1 hour) so we can actually download the video
    const sb = getSupabase();
    const { data: signedData, error: signedErr } = await sb.storage
      .from(BUCKET())
      .createSignedUrl(filePath, 3600);

    if (signedErr) throw new Error(`Failed to create signed URL: ${signedErr.message}`);

    const downloadUrl = signedData.signedUrl;
    console.log(`🔗 Signed URL generated for transcription`);

    // 3. Transcribe using Gemini (downloads from signed URL)
    const chunks = await transcribeVideo(downloadUrl);
    console.log(`✅ Transcribed ${chunks.length} segments`);

    // 4. Generate embeddings for semantic search
    const chunksWithEmbeddings = await generateEmbeddings(chunks);
    console.log(`✅ Generated ${chunksWithEmbeddings.length} embeddings`);

    // 5. Save to MongoDB
    await Vod.findByIdAndUpdate(vodId, {
      transcript:          chunksWithEmbeddings,
      transcriptionStatus: "done",
      transcribedAt:       new Date(),
    });

    console.log(`✅ Transcription complete for VOD: ${vodId}`);

  } catch (error) {
    console.error(`❌ Transcription failed for VOD: ${vodId}`, error);
    await Vod.findByIdAndUpdate(vodId, { transcriptionStatus: "failed" });
    throw error; // Bull will retry
  }
});

// Log queue events
transcribeQueue.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

transcribeQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

export default transcribeQueue;