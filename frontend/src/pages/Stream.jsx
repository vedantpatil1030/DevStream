// src/pages/Stream.jsx

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import { useSelector, useDispatch }    from "react-redux";
import { Users, Send }                 from "lucide-react";
import AgoraRTC                        from "agora-rtc-sdk-ng";
import toast                           from "react-hot-toast";

import { useGetStreamQuery }           from "../features/stream/streamApi";
import { selectCurrentUser }           from "../features/auth/authSlice";
import { addMessage, selectMessages }  from "../features/chat/chatSlice";
import socket                          from "../lib/socket";
import Spinner                         from "../components/layout/ui/Spinner";

// Agora viewer client
const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

export default function Stream() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const currentUser  = useSelector(selectCurrentUser);
  const messages     = useSelector(selectMessages);

  const { data, isLoading, isError } = useGetStreamQuery(id);

  const remoteVideoRef = useRef(null);
  const chatEndRef     = useRef(null);
  const [message,      setMessage]      = useState("");
  const [viewerCount,  setViewerCount]  = useState(0);
  const [agoraReady,   setAgoraReady]   = useState(false);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup Agora viewer
  useEffect(() => {
    if (!data?.stream) return;

    const joinAsViewer = async () => {
      const { agoraChannel, agoraToken, agoraAppId, uid } = data.stream;

      try {
        await agoraClient.setClientRole("audience");
        await agoraClient.join(agoraAppId, agoraChannel, agoraToken, uid);

        // Listen for remote streams
        agoraClient.on("user-published", async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);

          if (mediaType === "video") {
            user.videoTrack.play(remoteVideoRef.current);
            setAgoraReady(true);
          }
          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        agoraClient.on("user-unpublished", () => {
          setAgoraReady(false);
        });

      } catch (error) {
        console.error("Agora join error:", error);
        toast.error("Failed to join stream");
      }
    };

    joinAsViewer();

    return () => { agoraClient.leave(); };
  }, [data]);

  // Socket.io — chat + viewer count
  useEffect(() => {
    if (!id) return;

    socket.connect();
    socket.emit("stream:join", { streamId: id });

    socket.on("chat:receive", (msg) => {
      dispatch(addMessage(msg));
    });

    socket.on("stream:viewerCount", ({ count }) => {
      setViewerCount(count);
    });

    socket.on("stream:ended", () => {
      toast("Stream has ended", { icon: "📺" });
      setTimeout(() => navigate("/"), 2000);
    });

    return () => {
      socket.emit("stream:leave", { streamId: id });
      socket.off("chat:receive");
      socket.off("stream:viewerCount");
      socket.off("stream:ended");
      socket.disconnect();
    };
  }, [id]);

  const sendMessage = () => {
    if (!message.trim() || !currentUser) return;

    socket.emit("chat:send", {
      streamId: id,
      message,
      username: currentUser.username,
      avatar:   currentUser.avatar,
    });

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-500 font-mono">Stream not found or has ended</p>
    </div>
  );

  const stream = data?.stream;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Video + Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Video player */}
          <div
            ref={remoteVideoRef}
            className="w-full aspect-video bg-dark-800 border border-dark-600 rounded-xl overflow-hidden flex items-center justify-center"
          >
            {!agoraReady && (
              <div className="text-center">
                <Spinner />
                <p className="text-slate-600 font-mono text-sm mt-3">
                  Connecting to stream...
                </p>
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-100 mb-1">
                  {stream?.title}
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/u/${stream?.streamer?.name}`)}
                    className="text-sm text-slate-500 font-mono hover:text-brand-primary hover:bg-brand-primary/10 px-2 py-1 rounded transition-colors"
                  >
                    {stream?.streamer?.name}
                  </button>
                  <span className="text-xs text-slate-600">•</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Users size={11} />
                    {viewerCount} watching
                  </div>
                </div>
              </div>

              {/* Live badge */}
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400 font-mono">LIVE</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mt-4">
              {stream?.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-slate-500 bg-dark-700 border border-dark-500 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Chat */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl flex flex-col h-[600px]">

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-dark-600">
            <h3 className="text-sm font-semibold text-slate-300 font-mono">
              Live Chat
            </h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-600 font-mono">
                  No messages yet. Say hi! 👋
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-primary font-mono">
                      {msg.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-primary font-mono">
                      {msg.username}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 font-mono">
                      {msg.message}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 py-3 border-t border-dark-600">
            {currentUser ? (
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono outline-none focus:border-brand-primary transition-all"
                />
                <button
                  onClick={sendMessage}
                  className="bg-brand-primary text-white rounded-lg px-3 hover:bg-sky-400 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-mono text-center">
                <a href="/login" className="text-brand-primary hover:underline">
                  Sign in
                </a>{" "}
                to chat
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}