// server/services/transcribe.service.js
// Uses Google Gemini for transcription + embeddings (replaces OpenAI)
// Video transcription uses the Gemini File API → direct v1beta REST call
// (The JS SDK 0.24.x routes generateContent to v1 for some models, but
//  fileData is only supported in v1beta, so we call the REST API directly.)

import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI }             from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import fetch from 'node-fetch';
import fs    from 'fs';
import path  from 'path';
import os    from 'os';

const GEMINI_KEY  = process.env.GEMINI_API_KEY;
const genAI       = new GoogleGenerativeAI(GEMINI_KEY);
const fileManager = new GoogleAIFileManager(GEMINI_KEY);

// ─── TRANSCRIBE VIDEO ─────────────────────────────────────────
// Downloads video → uploads to Gemini File API → transcribes via REST → returns chunks
export const transcribeVideo = async (videoUrl) => {
  const tempPath = path.join(os.tmpdir(), `vod_${Date.now()}.mp4`);

  // 1. Download video to temp file
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

  try {
    const fileSizeMB = (fs.statSync(tempPath).size / 1024 / 1024).toFixed(1);
    console.log(`📤 Uploading ${fileSizeMB} MB video to Gemini File API…`);

    // 2. Upload to Gemini File API (no inline base64 — avoids token quota issues)
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType:    'video/mp4',
      displayName: path.basename(tempPath),
    });

    // 3. Wait for Gemini to finish processing the file
    let geminiFile = uploadResult.file;
    console.log(`⏳ Waiting for Gemini file processing (state: ${geminiFile.state})…`);

    while (geminiFile.state === FileState.PROCESSING) {
      await new Promise(r => setTimeout(r, 3000));
      geminiFile = await fileManager.getFile(geminiFile.name);
    }

    if (geminiFile.state === FileState.FAILED) {
      throw new Error('Gemini File API processing failed');
    }

    console.log(`📹 Transcribing with Gemini 1.5 Flash via v1beta REST…`);

    // 4. Call v1beta REST API directly — the JS SDK 0.24.x routes to v1 for
    //    gemini-1.5-flash which doesn't support the fileData part type.
    //    v1beta DOES support fileData, so we bypass the SDK here.
    const restResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  fileData: {
                    mimeType: geminiFile.mimeType,
                    fileUri:  geminiFile.uri,
                  },
                },
                {
                  text: `Transcribe this video completely and accurately.
Format the output as a JSON array of segments, where each segment has:
- "start": approximate start time in seconds (number)
- "end": approximate end time in seconds (number)
- "text": the spoken words in that segment (string)

Produce segments of roughly 5-15 seconds each.
Return ONLY the raw JSON array, no markdown, no explanation, no code fence.
Example: [{"start":0,"end":5,"text":"Hello world"},{"start":5,"end":10,"text":"Next sentence"}]`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!restResponse.ok) {
      const errBody = await restResponse.text();
      throw new Error(`Gemini REST API error ${restResponse.status}: ${errBody}`);
    }

    const restJson = await restResponse.json();
    const rawText  = restJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!rawText) throw new Error('Gemini returned empty transcription response');

    // 5. Parse JSON response
    let chunks;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      chunks = JSON.parse(cleaned);
    } catch {
      console.warn('⚠️ Gemini response not clean JSON, attempting extraction…');
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        chunks = JSON.parse(match[0]);
      } else {
        console.warn('⚠️ Could not parse as segments, creating single chunk');
        chunks = [{ start: 0, end: 0, text: rawText }];
      }
    }

    console.log(`✅ Transcribed ${chunks.length} segments`);

    // 6. Clean up the Gemini-hosted file
    try { await fileManager.deleteFile(geminiFile.name); } catch { /* non-fatal */ }

    return chunks;

  } finally {
    // 7. Always delete local temp file
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
};

// ─── GENERATE EMBEDDINGS ──────────────────────────────────────
// Converts text chunks to vectors for semantic search using Gemini
export const generateEmbeddings = async (chunks) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const chunksWithEmbeddings = [];

  // Process in batches of 5 to stay within rate limits
  for (let i = 0; i < chunks.length; i += 5) {
    const batch = chunks.slice(i, i + 5);

    const embeddings = await Promise.all(
      batch.map(async (chunk) => {
        const result = await model.embedContent(chunk.text || '');
        return { ...chunk, embedding: result.embedding.values };
      })
    );

    chunksWithEmbeddings.push(...embeddings);

    if (i + 5 < chunks.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`✅ Generated ${chunksWithEmbeddings.length} embeddings with Gemini`);
  return chunksWithEmbeddings;
};

// ─── SEARCH TRANSCRIPT ────────────────────────────────────────
export const searchTranscript = async (query, transcriptChunks) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  const queryResult = await model.embedContent(query);
  const queryVector = queryResult.embedding.values;

  const scored = transcriptChunks.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(queryVector, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .filter((chunk) => chunk.similarity > 0.3);
};

// Cosine similarity helper
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dot  = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};