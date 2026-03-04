// server/services/supabase.service.js

import { createClient } from "@supabase/supabase-js";
import fetch            from "node-fetch";

// ── Lazy client: only created when first used.
// This prevents the server from crashing on boot
// if SUPABASE_URL / SUPABASE_SERVICE_KEY are not yet set in .env
let _supabase = null;
function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase not configured — add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env"
    );
  }
  _supabase = createClient(url, key);
  return _supabase;
}

const BUCKET = () => process.env.SUPABASE_BUCKET;

// ─── UPLOAD VIDEO FROM URL ────────────────────────────────────
export const uploadVideoFromUrl = async (videoUrl, fileName) => {
  const sb = getClient();

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
  const buffer = await response.buffer();

  const { error } = await sb.storage
    .from(BUCKET())
    .upload(`videos/${fileName}`, buffer, { contentType: "video/mp4", cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = sb.storage.from(BUCKET()).getPublicUrl(`videos/${fileName}`);
  return urlData.publicUrl;
};

// ─── SIGNED URL ───────────────────────────────────────────────
export const getSignedUrl = async (path) => {
  const sb = getClient();
  const { data, error } = await sb.storage.from(BUCKET()).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
};

// ─── DELETE VIDEO ─────────────────────────────────────────────
export const deleteVideo = async (fileName) => {
  const sb = getClient();
  const { error } = await sb.storage.from(BUCKET()).remove([`videos/${fileName}`]);
  if (error) throw error;
  return true;
};