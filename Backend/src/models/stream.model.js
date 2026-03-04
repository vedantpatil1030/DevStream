import mongoose from "mongoose";
import Vod       from "./Vod.js";

const streamSchema = new mongoose.Schema({
    streamerId: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      "User",
        required: true,
    },
    title: {
        type:      String,
        required:  [true, "Stream title is required"],
        trim:      true,
        maxlength: [100, "Stream title must be less than 100 characters long"],
    },
    description: {
        type:      String,
        default:   "",
        maxlength: [500, "Stream description must be less than 500 characters long"],
    },
    category: {
        type:    String,
        enum:    ["Frontend","Backend","AI/ML","DevOps","Systems","OpenSource","Open Source","Other"],
        default: "Other",
    },
    tags: {
        type:     [String],
        validate: {
            validator: (tags) => tags.length <= 5,
            message:   "A stream can have up to 5 tags",
        },
    },
    agoraChannel: { type: String, required: true, unique: true },

    isLive:    { type: Boolean, default: true },
    startedAt: { type: Date,    default: Date.now },
    endedAt:   { type: Date,    default: null },
    duration:  { type: Number,  default: 0 },

    viewerCount: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    totalViews:  { type: Number, default: 0 },

    chatEnabled:       { type: Boolean, default: true },
    slowMode:          { type: Boolean, default: false },
    slowModeDelay:     { type: Number,  default: 0 },
    followersOnlyChat: { type: Boolean, default: false },

    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    moderators:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    vodId:        { type: mongoose.Schema.Types.ObjectId, ref: "VOD", default: null },
    thumbnailUrl: { type: String, default: "" },

    // Agora Cloud Recording
    agoraResourceId:  { type: String, default: "" },
    agoraSid:         { type: String, default: "" },
    agoraRecordingUid:{ type: Number, default: 0  },  // must match uid used in acquire/start/stop

}, { timestamps: true });

// ── CASCADE: when a Stream document is deleted (via findByIdAndDelete,
//    deleteOne, or directly from Atlas), soft-delete its linked VOD.
streamSchema.pre("deleteOne", { document: true, query: false }, async function () {
    if (this.vodId) {
        await Vod.findByIdAndUpdate(this.vodId, { isDeleted: true, isPublic: false });
        console.log(`🗑️  Cascade: VOD ${this.vodId} hidden because stream was deleted`);
    }
});

// Also covers Model.findByIdAndDelete() / Model.deleteOne(filter)
streamSchema.pre("deleteOne", { document: false, query: true }, async function () {
    const stream = await this.model.findOne(this.getFilter()).select("vodId");
    if (stream?.vodId) {
        await Vod.findByIdAndUpdate(stream.vodId, { isDeleted: true, isPublic: false });
        console.log(`🗑️  Cascade: VOD ${stream.vodId} hidden because stream was deleted`);
    }
});

streamSchema.pre("findOneAndDelete", async function () {
    const stream = await this.model.findOne(this.getFilter()).select("vodId");
    if (stream?.vodId) {
        await Vod.findByIdAndUpdate(stream.vodId, { isDeleted: true, isPublic: false });
        console.log(`🗑️  Cascade: VOD ${stream.vodId} hidden because stream was deleted`);
    }
});

const Stream = mongoose.model("Stream", streamSchema);
export default Stream;
