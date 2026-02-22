import Stream from '../models/stream.model.js';
import User from '../models/user.model.js';
import { generateAgoraToken } from '../services/agora.service.js';
import {v4 as uuidv4} from 'uuid';

//post /api/streams/start

export const startStream=async(req,res)=>{
    try{
        const{title,description,category,tags}=req.body;
        if(!title){
            return res.status(400).json({message: 'Title is required'});
        }
        const existingStream=await Stream.findOne({streamerId: req.user._id, isLive:true});
        if(existingStream){
            return res.status(400).json({message: 'You already have a live stream. Please end it before starting a new one.'});
        }
        const agoraChannel=`stream_${uuidv4().slice(0,8)}`;
        const uid=Math.floor(Math.random()*100000);
        const agoraToken=generateAgoraToken(agoraChannel, uid,"publisher");
        const stream=await Stream.create({
            streamerId: req.user._id,
            title,
            description:description || '',
            category: category || 'Other',
            tags: tags || [],
            agoraChannel,
        });

        await User.findByIdAndUpdate(req.user._id, {isStreamer: true});
       res.status(201).json({
            success: true,
            message: 'Stream started successfully',
            stream:{
                id: stream._id,
                title: stream.title,
                category: stream.category,
                tags: stream.tags,
                agoraChannel: stream.agoraChannel,
                agoraToken,
                agoraAppId: process.env.AGORA_APP_ID,
                uid,
                startedAt:stream.startedAt,
            },
       });

    }catch(error){
        res.status(500).json({message: error.message});
    }
};


//GET /api/streams

export const getAllStreams=async(req,res)=>{
    try{
        const{category,search}=req.query;
        const filter={isLive:true};
        if(category && category !=='ALL'){
            filter.category=category;
        }
        if(search){
        filter.$or = [
        { title:    { $regex: search, $options: "i" } },
        { tags:     { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        ];
        }

        const streams=await Stream.find(filter)
        .populate('streamerId', 'username avatar displayName followerCount')
        .sort({viewerCount: -1})
        .lean();

        res.status(200).json({
      success: true,
      count: streams.length,
      streams,
    });
    }catch(error){
       res.status(500).json({
      success: false,
      message: "Server error",
    });
    }
};

//get /api/streams/:id

export const getStream=async(req,res)=>{
    try{
    const stream = await Stream.findById(req.params.id)
      .populate("streamerId", "username avatar bio followerCount isStreamer");

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (!stream.isLive) {
      return res.status(400).json({
        success: false,
        message: "Stream has ended",
        vodId: stream.vodId,   // frontend can redirect to VOD
      });
    }

     // Generate viewer token
    const uid = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(
      stream.agoraChannel,
      uid,
      "subscriber"
    );

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
        agoraToken,                          // viewer uses this
        agoraAppId:   process.env.AGORA_APP_ID,
        uid,
      },
    });

    }catch(error){
       res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
    }
};

// ─── END STREAM ───────────────────────────────────────────────
// PUT /api/streams/:id/end
export const endStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    // Only the streamer can end their own stream
    if (stream.streamerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to end this stream",
      });
    }

    if (!stream.isLive) {
      return res.status(400).json({
        success: false,
        message: "Stream already ended",
      });
    }

    // Calculate duration
    const endedAt  = new Date();
    const duration = Math.floor((endedAt - stream.startedAt) / 1000);

    // Mark stream as ended
    await Stream.findByIdAndUpdate(stream._id, {
      isLive:   false,
      endedAt,
      duration,
    });

    // Get io from app (for notifying viewers — added in socket setup)
    const io = req.app.get("io");
    if (io) {
      io.to(`stream_${stream._id}`).emit("stream:ended", {
        message: "Stream has ended",
        streamId: stream._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Stream ended successfully",
      duration,   // seconds
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /api/streams/my/active
// Streamer checks if they're currently live
export const getMyActiveStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      streamerId: req.user._id,
      isLive: true,
    });

    if (!stream) {
      return res.status(200).json({
        success: true,
        stream: null,
        isLive: false,
      });
    }

    // Regenerate token in case it expired
    const uid = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(
      stream.agoraChannel,
      uid,
      "publisher"
    );

    res.status(200).json({
      success: true,
      isLive: true,
      stream: {
        id:           stream._id,
        title:        stream.title,
        agoraChannel: stream.agoraChannel,
        agoraToken,
        agoraAppId:   process.env.AGORA_APP_ID,
        uid,
        viewerCount:  stream.viewerCount,
        startedAt:    stream.startedAt,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};