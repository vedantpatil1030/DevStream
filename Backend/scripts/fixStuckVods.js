/**
 * scripts/fixStuckVods.js
 * ─────────────────────────────────────────────────────────────
 * One-time migration:
 *   1. Sets transcriptionStatus = "failed" on any VOD that has
 *      no videoUrl but is stuck on "pending" or "processing".
 *
 *   2. Soft-deletes any VOD whose parent streamId no longer
 *      exists in the Stream collection (orphaned after manual deletion).
 *
 * Run: node scripts/fixStuckVods.js
 */

import mongoose from "mongoose";
import dotenv   from "dotenv";
import Vod      from "../src/models/Vod.js";
import Stream   from "../src/models/stream.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected to MongoDB");

// ── Fix 1: stuck VODs with no video
const stuckResult = await Vod.updateMany(
  {
    videoUrl: { $in: ["", null] },
    transcriptionStatus: { $in: ["pending", "processing"] },
  },
  { $set: { transcriptionStatus: "failed" } }
);
console.log(`🔧 Marked ${stuckResult.modifiedCount} stuck VODs as "failed"`);

// ── Fix 2: orphaned VODs (stream was deleted from DB manually)
const allVods = await Vod.find({ isDeleted: false }).select("streamId").lean();
const streamIds = [...new Set(allVods.map(v => v.streamId?.toString()).filter(Boolean))];

const existingStreams = await Stream.find({ _id: { $in: streamIds } }).select("_id").lean();
const existingSet    = new Set(existingStreams.map(s => s._id.toString()));

const orphanIds = allVods
  .filter(v => v.streamId && !existingSet.has(v.streamId.toString()))
  .map(v => v._id);

if (orphanIds.length > 0) {
  const orphanResult = await Vod.updateMany(
    { _id: { $in: orphanIds } },
    { $set: { isDeleted: true, isPublic: false } }
  );
  console.log(`🗑️  Soft-deleted ${orphanResult.modifiedCount} orphaned VODs`);
} else {
  console.log("✅ No orphaned VODs found");
}

await mongoose.disconnect();
console.log("Done.");
