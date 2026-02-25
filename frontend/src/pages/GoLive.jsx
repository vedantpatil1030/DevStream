// src/pages/GoLive.jsx

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector }    from "react-redux";
import { useNavigate }                 from "react-router-dom";
import { Radio, Square, Users }        from "lucide-react";
import AgoraRTC                        from "agora-rtc-sdk-ng";
import toast                           from "react-hot-toast";

import { useStartStreamMutation, useEndStreamMutation } from "../features/stream/streamApi";
import { setMyLiveStream, clearMyLiveStream }           from "../features/stream/streamSlice";
import { selectIsLive, selectMyLiveStream }             from "../features/stream/streamSlice";
import Button  from "../components/layout/ui/Button";
import Input   from "../components/layout/ui/Input";

const CATEGORIES = ["Frontend", "Backend", "AI/ML", "DevOps", "Systems", "Open Source", "Other"];

// Agora client — created once
const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

export default function GoLive() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLive    = useSelector(selectIsLive);
  const myStream  = useSelector(selectMyLiveStream);

  const [startStream, { isLoading: isStarting }] = useStartStreamMutation();
  const [endStream,   { isLoading: isEnding   }] = useEndStreamMutation();

  // Form state
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Other");
  const [tags,        setTags]        = useState("");

  // Agora tracks
  const localVideoRef  = useRef(null);
  const localTrackRef  = useRef({ video: null, audio: null });

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopLocalTracks(); };
  }, []);

  const stopLocalTracks = async () => {
    if (localTrackRef.current.video) {
      localTrackRef.current.video.stop();
      localTrackRef.current.video.close();
    }
    if (localTrackRef.current.audio) {
      localTrackRef.current.audio.stop();
      localTrackRef.current.audio.close();
    }
    await agoraClient.leave();
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error("Stream title is required");
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);

      // 1. Hit your backend — get stream data + Agora token
      const result = await startStream({
        title,
        description,
        category,
        tags: tagsArray,
      }).unwrap();

      const { agoraChannel, agoraToken, agoraAppId, uid, id } = result.stream;

      // 2. Set Agora role to host
      await agoraClient.setClientRole("host");

      // 3. Join the Agora channel
      await agoraClient.join(agoraAppId, agoraChannel, agoraToken, uid);

      // 4. Create local camera + mic tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTrackRef.current = { video: videoTrack, audio: audioTrack };

      // 5. Play local video in preview div
      videoTrack.play(localVideoRef.current);

      // 6. Publish to channel (viewers can now see you)
      await agoraClient.publish([audioTrack, videoTrack]);

      // 7. Save to Redux
      dispatch(setMyLiveStream({ ...result.stream }));

      toast.success("You are live! 🔴");

    } catch (error) {
      console.error("Go live error:", error);
      toast.error(error?.data?.message || "Failed to go live");
      await stopLocalTracks();
    }
  };

  const handleEndStream = async () => {
    try {
      await endStream(myStream.id).unwrap();
      await stopLocalTracks();
      dispatch(clearMyLiveStream());
      toast.success("Stream ended");
      navigate("/");
    } catch (error) {
      toast.error("Failed to end stream");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left — Video Preview */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono mb-4 flex items-center gap-2">
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                You are LIVE
              </>
            ) : (
              "Camera Preview"
            )}
          </h2>

          {/* Video container */}
          <div
            ref={localVideoRef}
            className="w-full aspect-video bg-dark-800 border border-dark-600 rounded-xl overflow-hidden flex items-center justify-center"
          >
            {!isLive && (
              <div className="text-center">
                <Radio size={32} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-600 font-mono text-sm">
                  Camera preview will appear here
                </p>
              </div>
            )}
          </div>

          {/* Live stats */}
          {isLive && (
            <div className="mt-4 bg-dark-800 border border-dark-600 rounded-xl p-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-brand-primary" />
                <span className="text-sm font-mono text-slate-300">
                  {myStream?.viewerCount || 0} watching
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-red-400">LIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Right — Stream Settings */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono mb-4">
            Stream Settings
          </h2>

          <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 flex flex-col gap-4">

            <Input
              label="Stream Title *"
              placeholder="Building a REST API from scratch..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLive}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-400 font-mono">Description</label>
              <textarea
                placeholder="What are you building today?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLive}
                rows={3}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-400 font-mono">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLive}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono outline-none focus:border-brand-primary transition-all disabled:opacity-50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              label="Tags (comma separated, max 5)"
              placeholder="React, Node, TypeScript"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isLive}
            />

            {/* Action button */}
            <div className="pt-2">
              {!isLive ? (
                <Button
                  fullWidth
                  loading={isStarting}
                  onClick={handleGoLive}
                >
                  <Radio size={15} />
                  Go Live
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="danger"
                  loading={isEnding}
                  onClick={handleEndStream}
                >
                  <Square size={15} />
                  End Stream
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}