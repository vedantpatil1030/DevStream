// server/services/agoraRecording.service.js

import fetch from "node-fetch";

// These are read lazily so they pick up .env values after dotenv loads
const getAuth = () => {
  const id     = process.env.AGORA_CUSTOMER_ID;
  const secret = process.env.AGORA_CUSTOMER_SECRET;
  if (!id || !secret) throw new Error("AGORA_CUSTOMER_ID / AGORA_CUSTOMER_SECRET not set in .env");
  return Buffer.from(`${id}:${secret}`).toString("base64");
};

const getBaseUrl = () =>
  `https://api.agora.io/v1/apps/${process.env.AGORA_APP_ID}/cloud_recording`;

const makeHeaders = () => ({
  "Authorization": `Basic ${getAuth()}`,
  "Content-Type":  "application/json",
});

// ─── ACQUIRE ──────────────────────────────────────────────────
export const acquireResource = async (channelName, uid) => {
  const res  = await fetch(`${getBaseUrl()}/acquire`, {
    method:  "POST",
    headers: makeHeaders(),
    body: JSON.stringify({
      cname: channelName,
      uid:   uid.toString(),
      clientRequest: { resourceExpiredHour: 24 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Acquire failed: ${JSON.stringify(data)}`);
  console.log("✅ Agora acquire:", data.resourceId);
  return data.resourceId;
};

// ─── START RECORDING ──────────────────────────────────────────
export const startRecording = async (channelName, uid, resourceId, token) => {
  // Supabase S3-compatible endpoint
  // Format: https://<project>.supabase.co/storage/v1/s3
  const supabaseProject = (process.env.SUPABASE_URL || "").replace("https://", "").replace(".supabase.co", "");
  const endpoint        = process.env.SUPABASE_S3_ENDPOINT ||
    `https://${supabaseProject}.supabase.co/storage/v1/s3`;

  const res = await fetch(
    `${getBaseUrl()}/resourceid/${resourceId}/mode/mix/start`,
    {
      method:  "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        cname: channelName,
        uid:   uid.toString(),
        clientRequest: {
          token,
          recordingConfig: {
            maxIdleTime:     30,
            streamTypes:     2,      // audio + video
            channelType:     1,      // live broadcast (not communication)
            videoStreamType: 0,
            transcodingConfig: {
              width:  1280, height: 720,
              bitrate: 2260, fps: 15,
              mixedVideoLayout: 1,
            },
          },
          storageConfig: {
            vendor:    10,               // 10 = AWS S3 compatible with custom endpoint
            region:    0,
            bucket:    process.env.SUPABASE_BUCKET,
            accessKey: process.env.SUPABASE_ACCESS_KEY,
            secretKey: process.env.SUPABASE_SECRET_KEY,
            vendor:    1,              // AWS S3 compatible
            region:    14,             // us-east-1 (Supabase default)
            fileNamePrefix: ["recordings"],
            extensionParams: {
              endpoint,               // Supabase S3 endpoint
            },
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Start recording failed: ${JSON.stringify(data)}`);
  console.log("✅ Agora recording started — sid:", data.sid);
  return { sid: data.sid, resourceId };
};

// ─── STOP RECORDING ───────────────────────────────────────────
export const stopRecording = async (channelName, uid, resourceId, sid) => {
  const res = await fetch(
    `${getBaseUrl()}/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
    {
      method:  "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        cname: channelName,
        uid:   uid.toString(),
        clientRequest: {},
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Stop recording failed: ${JSON.stringify(data)}`);
  console.log("✅ Agora recording stopped. FileList:", JSON.stringify(data.serverResponse?.fileList));
  return data.serverResponse?.fileList || [];
};

// ─── QUERY RECORDING (check status) ───────────────────────────
export const queryRecording = async (resourceId, sid) => {
  const res = await fetch(
    `${getBaseUrl()}/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
    { method: "GET", headers: makeHeaders() }
  );
  const data = await res.json();
  return data;
};