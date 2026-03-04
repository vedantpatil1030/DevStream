// src/pages/GoLive.jsx  —  DevStream Studio

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Radio, Square, Mic, MicOff, Video, VideoOff,
  Monitor, Camera, LayoutGrid, Wifi, Clock, Users,
  Settings, ChevronDown, ChevronUp, Share2, Loader2,
  AlertTriangle, CheckCircle2, XCircle, Info,
  MessageSquare, Sliders, Shield, Activity,
  Coffee, Zap, RefreshCw, Volume2, VolumeX,
} from "lucide-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import toast from "react-hot-toast";

import {
  useStartStreamMutation,
  useEndStreamMutation,
  useGetMyActiveStreamQuery,
  useUpdateStreamMutation,
} from "../features/stream/streamApi";
import { setMyLiveStream, clearMyLiveStream } from "../features/stream/streamSlice";
import { selectIsLive, selectMyLiveStream } from "../features/stream/streamSlice";

/* ─────────────────────── constants ──────────────────────────── */
const CATEGORIES = ["Frontend", "Backend", "AI/ML", "DevOps", "Systems", "Open Source", "Other"];
const RESOLUTIONS = [
  { label: "720p", value: { width: 1280, height: 720, bitrateMax: 2500 } },
  { label: "1080p", value: { width: 1920, height: 1080, bitrateMax: 4500 } },
  { label: "4K", value: { width: 3840, height: 2160, bitrateMax: 15000 } },
];
const FPS_OPTIONS = [15, 30, 60];
const BITRATE_OPTIONS = ["Auto", "1000", "2000", "3000", "4500", "6000"];
const DELAY_OPTIONS = [0, 5, 10, 30, 60];

/* ─────────────────────── one Agora client ───────────────────── */
const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

/* ─────────────────────── helpers ────────────────────────────── */
function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─────────────────────── tiny components ────────────────────── */
function Dot({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: ok === true ? "#4ade80" : ok === false ? "#f87171" : "#f59e0b",
        boxShadow: ok === true ? "0 0 6px #4ade80" : ok === false ? "0 0 6px #f87171" : "0 0 6px #f59e0b",
      }} />
      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "rgba(148,163,184,0.8)" }}>{label}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid rgba(6,182,212,0.1)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "rgba(5,8,16,0.6)",
          border: "none", cursor: "pointer",
          fontFamily: "JetBrains Mono", fontSize: "0.65rem", fontWeight: 700,
          color: "rgba(6,182,212,0.7)", letterSpacing: "0.1em", textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 1, background: "rgba(6,182,212,0.4)" }} />
          {title}
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div style={{ padding: "14px", background: "rgba(2,4,8,0.5)", display: "flex", flexDirection: "column", gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(6,182,212,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span style={{ color: "rgba(168,85,247,0.5)", marginRight: 3 }}>//</span>{label}
      </label>
      {children}
    </div>
  );
}

const INP = (disabled = false) => ({
  width: "100%", boxSizing: "border-box",
  background: disabled ? "rgba(5,8,16,0.3)" : "rgba(5,8,16,0.8)",
  border: "1px solid rgba(6,182,212,0.18)", borderRadius: 7,
  padding: "8px 10px", fontFamily: "JetBrains Mono", fontSize: "0.75rem",
  color: disabled ? "#384152" : "#e2e8f0", outline: "none", transition: "all 0.2s",
  cursor: disabled ? "not-allowed" : undefined,
});

function Inp({ disabled, onFocus, onBlur, ...props }) {
  return (
    <input
      disabled={disabled}
      style={INP(disabled)}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = "rgba(6,182,212,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; } if (onFocus) onFocus(e); }}
      onBlur={e => { e.target.style.borderColor = "rgba(6,182,212,0.18)"; e.target.style.boxShadow = "none"; if (onBlur) onBlur(e); }}
      {...props}
    />
  );
}

function Sel({ disabled, children, ...props }) {
  return (
    <select
      disabled={disabled}
      style={{ ...INP(disabled), appearance: "none", cursor: disabled ? "not-allowed" : "pointer" }}
      {...props}
    >
      {children}
    </select>
  );
}

function Toggle({ on, onToggle, label, desc }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 12px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${on ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.08)"}`,
        background: on ? "rgba(6,182,212,0.05)" : "rgba(5,8,16,0.4)",
        transition: "all 0.18s",
      }}
    >
      <div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: on ? "#e2e8f0" : "#475569", fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontFamily: "JetBrains Mono", fontSize: "0.57rem", color: "rgba(100,116,139,0.45)", marginTop: 1 }}>{desc}</div>}
      </div>
      <div style={{
        width: 34, height: 18, borderRadius: 9, position: "relative", flexShrink: 0, transition: "all 0.2s",
        background: on ? "rgba(6,182,212,0.45)" : "rgba(100,116,139,0.15)",
        border: `1px solid ${on ? "rgba(6,182,212,0.6)" : "rgba(100,116,139,0.2)"}`,
      }}>
        <div style={{
          position: "absolute", top: 2, left: on ? 15 : 2, width: 12, height: 12, borderRadius: "50%",
          background: on ? "#22d3ee" : "#475569", transition: "all 0.2s",
          boxShadow: on ? "0 0 5px rgba(34,211,238,0.6)" : "none",
        }} />
      </div>
    </div>
  );
}

/* Audio level meter */
function AudioMeter({ stream }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const ctxRef = useRef(null);
  const analRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ac;
    const src = ac.createMediaStreamSource(stream);
    const anal = ac.createAnalyser();
    anal.fftSize = 256;
    src.connect(anal);
    analRef.current = anal;
    const buf = new Uint8Array(anal.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      anal.getByteFrequencyData(buf);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      const fill = Math.min((avg / 128) * canvas.width, canvas.width);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "#22d3ee");
      grad.addColorStop(0.6, "#4ade80");
      grad.addColorStop(0.85, "#facc15");
      grad.addColorStop(1, "#f87171");
      ctx.fillStyle = "rgba(5,8,16,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, fill, canvas.height);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); ac.close(); };
  }, [stream]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(6,182,212,0.5)", letterSpacing: "0.1em" }}>
        <span style={{ color: "rgba(168,85,247,0.5)" }}>//</span> MIC LEVEL
      </span>
      <canvas
        ref={canvasRef}
        width={260} height={14}
        style={{ width: "100%", height: 10, borderRadius: 4, border: "1px solid rgba(6,182,212,0.15)" }}
      />
    </div>
  );
}

/* Confirmation modal */
function ConfirmModal({ onConfirm, onCancel, isEnding }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "rgba(9,12,22,0.98)", border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: 14, padding: 28, maxWidth: 380, width: "90%",
        boxShadow: "0 0 60px rgba(239,68,68,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#f87171" />
          <span style={{ fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: "0.9rem", color: "#f87171" }}>End Stream?</span>
        </div>
        <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.72rem", color: "rgba(148,163,184,0.7)", lineHeight: 1.6, marginBottom: 20 }}>
          Your stream will end immediately. A VOD will be saved automatically. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, fontFamily: "JetBrains Mono", fontWeight: 700,
              fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s",
              background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.25)", color: "#94a3b8",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isEnding}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, fontFamily: "JetBrains Mono", fontWeight: 800,
              fontSize: "0.75rem", cursor: "pointer", letterSpacing: "0.06em",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171",
            }}
          >
            {isEnding ? "Ending…" : "YES, END STREAM"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function GoLive() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLive = useSelector(selectIsLive);
  const myStream = useSelector(selectMyLiveStream);

  const [startStream, { isLoading: isStarting }] = useStartStreamMutation();
  const [endStream, { isLoading: isEnding }] = useEndStreamMutation();
  const [updateStream] = useUpdateStreamMutation();
  const { data: activeStreamData } = useGetMyActiveStreamQuery();

  /* ── Rehydrate on refresh ── */
  useEffect(() => {
    if (activeStreamData?.isLive && activeStreamData.stream && !isLive) {
      const s = activeStreamData.stream;
      dispatch(setMyLiveStream({ ...s, id: s.id ?? s._id }));
      // pre-fill edit fields from running stream
      setTitle(s.title ?? "");
      setDescription(s.description ?? "");
      setCategory(s.category ?? "Other");
      setTagsInput((s.tags ?? []).join(", "));
      setChatEnabled(s.chatEnabled ?? true);
      setSlowMode(s.slowMode ?? false);
      setSlowModeDelay(s.slowModeDelay ?? 0);
      setFollowersOnly(s.followersOnlyChat ?? false);
    }
  }, [activeStreamData]);

  /* ── Form ── */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [tagsInput, setTagsInput] = useState("");

  /* ── Technical ── */
  const [source, setSource] = useState("camera");
  const [resolution, setResolution] = useState(0);   // index into RESOLUTIONS
  const [fps, setFps] = useState(30);
  const [bitrate, setBitrate] = useState("Auto");

  /* ── Devices ── */
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selCamera, setSelCamera] = useState("");
  const [selMic, setSelMic] = useState("");
  const [micStream, setMicStream] = useState(null); // for audio meter

  /* ── Privacy / chat ── */
  const [privacy, setPrivacy] = useState("public");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [slowMode, setSlowMode] = useState(false);
  const [slowModeDelay, setSlowModeDelay] = useState(10);
  const [followersOnly, setFollowersOnly] = useState(false);

  /* ── Controls ── */
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isBRB, setIsBRB] = useState(false);

  /* ── Health ── */
  const [netOk, setNetOk] = useState(null);   // null=checking, true, false
  const [netTesting, setNetTesting] = useState(false);

  /* ── Stats ── */
  const [elapsed, setElapsed] = useState(0);
  const [viewers, setViewers] = useState(0);

  /* ── UI ── */
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCat, setEditCat] = useState("Other");

  /* ── Recording upload ── */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  /* ── Refs ── */
  const previewRef = useRef(null);
  const pipRef = useRef(null);
  const tracksRef = useRef({ video: null, audio: null, screen: null });
  const timerRef = useRef(null);
  const recorderRef = useRef(null);   // MediaRecorder
  const chunksRef = useRef([]);     // recorded Blob chunks
  const vodIdRef = useRef(null);   // VOD id returned from endStream

  /* ── Enumerate devices on mount ── */
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const vids = devs.filter(d => d.kind === "videoinput");
      const aids = devs.filter(d => d.kind === "audioinput");
      setVideoDevices(vids);
      setAudioDevices(aids);
      if (vids[0]) setSelCamera(vids[0].deviceId);
      if (aids[0]) setSelMic(aids[0].deviceId);
    }).catch(() => { });
  }, []);

  /* ── Mic preview stream for audio meter ── */
  useEffect(() => {
    if (!selMic || isLive) return;
    let stream;
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: selMic }, video: false })
      .then(s => { stream = s; setMicStream(s); })
      .catch(() => { });
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); setMicStream(null); };
  }, [selMic, isLive]);

  /* ── Timer ── */
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current); setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  /* ── Viewer count poll (every 30s) ── */
  useEffect(() => {
    if (!isLive || !myStream?.id) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/streams/${myStream.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
        .then(r => r.json())
        .then(d => { if (d.stream?.viewerCount !== undefined) setViewers(d.stream.viewerCount); })
        .catch(() => { });
    }, 30000);
    return () => clearInterval(id);
  }, [isLive, myStream]);

  /* ── Keyboard shortcuts (live mode) ── */
  useEffect(() => {
    if (!isLive) return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") toggleMic();
      if (e.key === "v" || e.key === "V") toggleCam();
      if (e.key === "b" || e.key === "B") setIsBRB(p => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLive, micOn, camOn]);

  /* ── Cleanup ── */
  useEffect(() => () => stopAll(), []);

  /* ── Network test ── */
  const runNetworkTest = async () => {
    setNetTesting(true); setNetOk(null);
    try {
      const start = Date.now();
      await fetch("https://www.google.com/favicon.ico?r=" + Math.random(), { cache: "no-store", mode: "no-cors" });
      const rtt = Date.now() - start;
      const conn = navigator.connection;
      const dl = conn?.downlink ?? 10;
      setNetOk(rtt < 400 && dl > 2);
      toast[rtt < 400 && dl > 2 ? "success" : "error"](
        rtt < 400 && dl > 2 ? `Network OK — ${rtt}ms RTT` : `Slow connection detected (${rtt}ms)`
      );
    } catch { setNetOk(false); }
    setNetTesting(false);
  };

  const stopAll = async () => {
    const t = tracksRef.current;
    [t.video, t.screen, t.audio].forEach(tr => { try { tr?.stop(); tr?.close(); } catch { } });
    tracksRef.current = { video: null, audio: null, screen: null };
    try { await agoraClient.leave(); } catch { }
  };

  /* ─── Go Live ───────────────────────────────────────────────── */
  const handleGoLive = async () => {
    if (!title.trim()) { toast.error("Stream title is required"); return; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); setMicStream(null); }

    try {
      const tagsArray = tagsInput.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5);
      const result = await startStream({ title, description, category, tags: tagsArray }).unwrap();
      const { agoraChannel, agoraToken, agoraAppId, uid } = result.stream;

      await agoraClient.setClientRole("host");
      await agoraClient.join(agoraAppId, agoraChannel, agoraToken, uid);

      const res = RESOLUTIONS[resolution];
      const encCfg = {
        width: res.value.width,
        height: res.value.height,
        frameRate: fps,
        bitrateMax: bitrate === "Auto" ? res.value.bitrateMax : Number(bitrate),
      };
      const publishTracks = [];

      // Audio
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selMic || undefined,
      });
      tracksRef.current.audio = audioTrack;
      audioTrack.setEnabled(micOn);
      publishTracks.push(audioTrack);

      // ── Video: Agora only supports ONE video track per user.
      // camera-only  → publish camera
      // screen-only  → publish screen
      // both         → publish screen; camera plays LOCALLY only as PiP
      if (source === "camera") {
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          cameraId: selCamera || undefined,
          encoderConfig: encCfg,
        });
        tracksRef.current.video = videoTrack;
        videoTrack.play(previewRef.current);
        publishTracks.push(videoTrack);   // ← only published in camera-only mode

      } else if (source === "screen") {
        const screenVideo = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: "1080p_1", optimizationMode: "detail" },
          "disable"
        );
        tracksRef.current.screen = screenVideo;
        screenVideo.play(previewRef.current);
        publishTracks.push(screenVideo);  // ← only video track published

      } else if (source === "both") {
        // 1. Create camera — local preview / PiP only, NOT published
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          cameraId: selCamera || undefined,
          encoderConfig: encCfg,
        });
        tracksRef.current.video = videoTrack;
        // Will play in PiP once screen track is ready (below)

        // 2. Create screen — this is the ONE video track we publish
        const screenVideo = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: "1080p_1", optimizationMode: "detail" },
          "disable"
        );
        tracksRef.current.screen = screenVideo;
        screenVideo.play(previewRef.current);           // screen → main preview
        if (pipRef.current) videoTrack.play(pipRef.current); // camera → PiP corner
        publishTracks.push(screenVideo);                // ← only screen is published
      }

      await agoraClient.publish(publishTracks);
      dispatch(setMyLiveStream({ ...result.stream }));
      setEditTitle(title); setEditCat(category);

      // ── Start browser-side MediaRecorder ─────────────────────────
      // Wait for Agora to attach its <video> element to the preview div
      await new Promise(r => setTimeout(r, 400));
      try {
        const mediaStreamTracks = [];

        // ── Method 1 (most reliable): captureStream() from the <video> Agora rendered
        const previewVideoEl = previewRef.current?.querySelector("video");
        if (previewVideoEl && typeof previewVideoEl.captureStream === "function") {
          const captured = previewVideoEl.captureStream(30);
          captured.getVideoTracks().forEach(t => mediaStreamTracks.push(t));
          console.log("🎙️ Video track via captureStream:", captured.getVideoTracks().length);
        } else {
          // ── Method 2: Agora track's getMediaStreamTrack()
          console.log("⚠️ captureStream not available, trying getMediaStreamTrack()");
          const videoSource = tracksRef.current.screen || tracksRef.current.video;
          if (videoSource) {
            const vt = videoSource.getMediaStreamTrack?.();
            if (vt) { mediaStreamTracks.push(vt); console.log("🎙️ Video track via getMediaStreamTrack"); }
          }
        }

        // Audio: always try getMediaStreamTrack() on the Agora audio track
        if (tracksRef.current.audio) {
          const at = tracksRef.current.audio.getMediaStreamTrack?.();
          if (at) { mediaStreamTracks.push(at); console.log("🎙️ Audio track acquired"); }
        }

        console.log("🎙️ Total tracks for MediaRecorder:", mediaStreamTracks.length);

        if (mediaStreamTracks.length > 0) {
          const combinedStream = new MediaStream(mediaStreamTracks);
          const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : MediaRecorder.isTypeSupported("video/webm")
              ? "video/webm"
              : "";
          chunksRef.current = [];
          const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : {});
          recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
          recorder.start(1000);
          recorderRef.current = recorder;
          console.log("✅ MediaRecorder started, mimeType:", recorder.mimeType);
        } else {
          console.warn("❌ No tracks found — recording will not be saved");
        }
      } catch (recErr) {
        console.warn("❌ MediaRecorder setup failed:", recErr.message);
      }

      toast.success("You're live! 🔴");

    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || "Failed to go live");
      await stopAll();
    }
  };

  /* ─── End stream ────────────────────────────────────────────── */
  const handleEndStream = async () => {
    try {
      const result = await endStream(myStream.id).unwrap();
      const vodId = result.vodId?.toString();
      vodIdRef.current = vodId;

      dispatch(clearMyLiveStream());
      setShowConfirm(false);

      const rec = recorderRef.current;

      if (rec && rec.state === "recording" && vodId) {
        // ── CRITICAL ORDER: stop recorder FIRST so it captures all data
        // THEN stop Agora tracks (if we stop Agora first, the captureStream
        // tracks become "ended" and the recorder auto-stops with no data)
        const mimeType = rec.mimeType || "video/webm";

        rec.onstop = async () => {
          // NOW it's safe to stop Agora (recorder already has all the data)
          await stopAll();

          const blob = new Blob(chunksRef.current, { type: mimeType });
          const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
          console.log(`📦 Recording blob ready: ${sizeMB} MB, chunks: ${chunksRef.current.length}`);

          if (blob.size < 10000) {
            toast("Stream too short — no recording saved");
            navigate("/");
            return;
          }

          setUploading(true);
          setUploadProgress(`Uploading recording (${sizeMB} MB)…`);

          try {
            const formData = new FormData();
            formData.append("video", blob, "recording.webm");

            const token = localStorage.getItem("token");
            const res = await fetch(
              `${import.meta.env.VITE_API_URL}/vods/${vodId}/upload-video`,
              { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
            );
            const data = await res.json();

            if (data.success) {
              toast.success("🎬 Recording saved! VOD is ready.");
            } else {
              toast.error("Upload failed: " + (data.message || "unknown error"));
            }
          } catch (uploadErr) {
            toast.error("Upload failed: " + uploadErr.message);
          } finally {
            setUploading(false);
            navigate("/vods");
          }
        };

        rec.stop(); // triggers onstop after flushing remaining data

      } else {
        // No recorder (e.g. page was refreshed mid-stream) — just clean up
        console.log("No active recorder, state:", rec?.state);
        await stopAll();
        toast.success("Stream ended");
        navigate("/");
      }
    } catch { toast.error("Failed to end stream"); }
  };

  /* ─── Runtime controls ───────────────────────────────────────  */
  const toggleMic = async () => {
    const next = !micOn; setMicOn(next);
    if (tracksRef.current.audio) await tracksRef.current.audio.setEnabled(next);
  };
  const toggleCam = async () => {
    const next = !camOn; setCamOn(next);
    if (tracksRef.current.video) await tracksRef.current.video.setEnabled(next);
  };

  /* ─── Mid-stream meta update ────────────────────────────────── */
  const handleUpdateMeta = async () => {
    if (!myStream?.id) return;
    try {
      await updateStream({ id: myStream.id, title: editTitle, category: editCat }).unwrap();
      toast.success("Stream info updated!");
      setEditingMeta(false);
    } catch { toast.error("Failed to update"); }
  };

  /* ─── Chat settings push ────────────────────────────────────── */
  const pushChatSettings = async (patch) => {
    if (!myStream?.id) return;
    try { await updateStream({ id: myStream.id, ...patch }).unwrap(); }
    catch { toast.error("Failed to update chat settings"); }
  };

  /* ─── Copy stream link ──────────────────────────────────────── */
  const copyLink = () => {
    if (!myStream?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/stream/${myStream.id}`);
    toast.success("Stream link copied!");
  };

  /* ═══════════════════════ STYLES ════════════════════════════ */
  const panel = {
    background: "rgba(5,8,16,0.72)", border: "1px solid rgba(6,182,212,0.1)",
    borderRadius: 12, overflow: "hidden",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  };
  const panelHead = (extra = {}) => ({
    padding: "10px 14px", borderBottom: "1px solid rgba(6,182,212,0.08)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(2,4,8,0.4)", ...extra,
  });
  const panelLabel = {
    fontFamily: "JetBrains Mono", fontSize: "0.6rem",
    color: "rgba(6,182,212,0.55)", letterSpacing: "0.12em",
  };
  const ctrlBtn = (active, danger) => ({
    display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
    borderRadius: 7, cursor: "pointer", transition: "all 0.18s",
    fontFamily: "JetBrains Mono", fontSize: "0.68rem", fontWeight: 600,
    whiteSpace: "nowrap",
    border: `1px solid ${danger ? (active ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)") : (active ? "rgba(6,182,212,0.45)" : "rgba(6,182,212,0.12)")}`,
    background: danger ? (active ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.05)") : (active ? "rgba(6,182,212,0.1)" : "rgba(5,8,16,0.5)"),
    color: danger ? (active ? "#f87171" : "rgba(248,113,113,0.5)") : (active ? "#22d3ee" : "rgba(148,163,184,0.5)"),
    boxShadow: active && !danger ? "0 0 8px rgba(6,182,212,0.12)" : "none",
  });

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1.75rem 1.5rem", width: "100%" }}>

      {showConfirm && <ConfirmModal onConfirm={handleEndStream} onCancel={() => setShowConfirm(false)} isEnding={isEnding} />}

      {/* Upload progress overlay */}
      {uploading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,4,8,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Loader2 size={40} color="#22d3ee" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ fontFamily: "JetBrains Mono", fontSize: "1rem", fontWeight: 700, color: "#22d3ee" }}>{uploadProgress}</p>
          <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.6)" }}>Do not close this tab — uploading your recording to Cloudinary…</p>
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLive ? (
            <>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444", animation: "livePulse 1.5s infinite", display: "inline-block" }} />
              <span style={{ fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: "1.3rem", color: "#f87171", letterSpacing: "0.04em" }}>LIVE</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.75rem", color: "rgba(248,113,113,0.55)" }}>{fmt(elapsed)}</span>
            </>
          ) : (
            <>
              <Radio size={19} color="#22d3ee" />
              <span style={{ fontFamily: "Inter,sans-serif", fontWeight: 800, fontSize: "1.35rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                Stream <span style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Studio</span>
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isLive && (
            <>
              <button onClick={copyLink} style={ctrlBtn(false, false)}>
                <Share2 size={12} /> Copy Link
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <Users size={12} color="#a855f7" />
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.68rem", color: "#c084fc" }}>{viewers} watching</span>
              </div>
            </>
          )}
          {!isLive && (
            <button onClick={runNetworkTest} disabled={netTesting} style={ctrlBtn(!netTesting, false)}>
              {netTesting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Wifi size={12} />}
              {netTesting ? "Testing…" : "Test Network"}
            </button>
          )}
        </div>
      </div>

      {/* ══ Two-column layout ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 370px", gap: "1.25rem", alignItems: "start" }}>

        {/* ════ LEFT ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* ── Preview panel ── */}
          <div style={panel}>
            <div style={panelHead()}>
              <span style={panelLabel}>◈ PREVIEW</span>
              {isLive && (
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={10} /> HD
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(248,113,113,0.8)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} /> {fmt(elapsed)}
                  </span>
                </div>
              )}
            </div>

            {/* Video container */}
            <div style={{ position: "relative", background: "#020408" }}>
              <div
                ref={previewRef}
                style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg,#020408,#09101e)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}
              >
                {!isLive && (
                  <div style={{ textAlign: "center", zIndex: 1, pointerEvents: "none" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(6,182,212,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", background: "rgba(6,182,212,0.04)" }}>
                      {source === "screen" ? <Monitor size={26} color="rgba(6,182,212,0.3)" /> : <Camera size={26} color="rgba(6,182,212,0.3)" />}
                    </div>
                    <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.45)" }}>Preview will appear when live</p>
                  </div>
                )}
              </div>

              {/* BRB overlay */}
              {isLive && isBRB && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(2,4,8,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                  <Coffee size={40} color="rgba(6,182,212,0.4)" style={{ marginBottom: 12 }} />
                  <p style={{ fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: "1.4rem", color: "rgba(6,182,212,0.6)", letterSpacing: "0.12em" }}>BRB</p>
                  <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.4)", marginTop: 4 }}>Be Right Back</p>
                </div>
              )}

              {/* LIVE badge */}
              {isLive && (
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.45)", borderRadius: 5, padding: "3px 9px", fontFamily: "JetBrains Mono", fontSize: "0.6rem", fontWeight: 800, color: "#f87171", letterSpacing: "0.12em", backdropFilter: "blur(4px)", zIndex: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.5s infinite" }} /> LIVE
                </div>
              )}

              {/* Camera PiP (screen+cam mode) */}
              {isLive && source === "both" && (
                <div ref={pipRef} style={{ position: "absolute", bottom: 10, right: 10, width: 150, height: 85, borderRadius: 7, border: "2px solid rgba(6,182,212,0.35)", overflow: "hidden", background: "#020408", zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }} />
              )}
            </div>

            {/* Controls bar */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(6,182,212,0.07)", background: "rgba(2,4,8,0.5)", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <button onClick={toggleMic} style={ctrlBtn(micOn, !micOn)}>
                {micOn ? <Mic size={13} /> : <MicOff size={13} />}
                {micOn ? "Mic On" : "Mic Off"}
              </button>
              <button onClick={toggleCam} style={ctrlBtn(camOn, !camOn)}>
                {camOn ? <Video size={13} /> : <VideoOff size={13} />}
                {camOn ? "Cam On" : "Cam Off"}
              </button>
              {isLive && (
                <button onClick={() => setIsBRB(p => !p)} style={ctrlBtn(!isBRB, false)}>
                  <Coffee size={13} /> {isBRB ? "Resume" : "BRB"}
                </button>
              )}
              <div style={{ marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: "0.58rem", color: "rgba(100,116,139,0.4)" }}>
                {isLive ? "M·mic  V·cam  B·brb" : "keyboard shortcuts active when live"}
              </div>
            </div>
          </div>

          {/* ── Source selector (pre-live) ── */}
          {!isLive && (
            <div style={panel}>
              <div style={{ padding: "14px" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(6,182,212,0.5)", letterSpacing: "0.12em", marginBottom: 10 }}>
                  <span style={{ color: "rgba(168,85,247,0.5)" }}>//</span> BROADCAST SOURCE
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "camera", icon: Camera, label: "Camera Only" },
                    { id: "screen", icon: Monitor, label: "Screen Only" },
                    { id: "both", icon: LayoutGrid, label: "Screen + Cam" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setSource(id)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 4px", borderRadius: 7, cursor: "pointer", transition: "all 0.18s",
                        fontFamily: "JetBrains Mono", fontSize: "0.68rem", fontWeight: source === id ? 700 : 500,
                        border: `1px solid ${source === id ? "rgba(6,182,212,0.5)" : "rgba(6,182,212,0.1)"}`,
                        background: source === id ? "rgba(6,182,212,0.12)" : "rgba(5,8,16,0.5)",
                        color: source === id ? "#22d3ee" : "rgba(148,163,184,0.5)",
                        boxShadow: source === id ? "0 0 12px rgba(6,182,212,0.15)" : "none",
                      }}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(100,116,139,0.4)", marginTop: 8 }}>
                  {source === "camera" && "> Webcam · 720p–4K · single device"}
                  {source === "screen" && "> Full display capture · 1080p detail · system chrome"}
                  {source === "both" && "> Screen as main · camera as PiP · screen published to viewers"}
                </p>
              </div>
            </div>
          )}

          {/* ── Health (live) ── */}
          {isLive && (
            <div style={panel}>
              <div style={{ padding: "14px" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(6,182,212,0.5)", letterSpacing: "0.12em", marginBottom: 12 }}>
                  <span style={{ color: "rgba(168,85,247,0.5)" }}>//</span> STREAM HEALTH
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                  <Dot ok={true} label="Camera detected" />
                  <Dot ok={true} label="Mic detected" />
                  <Dot ok={netOk} label={netOk === null ? "Network: unchecked" : netOk ? "Network: stable" : "Network: poor"} />
                  <Dot ok={true} label="Platform connected" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* ── Stream info ── */}
          <div style={panel}>
            <div style={panelHead()}>
              <span style={panelLabel}>◈ STREAM INFO</span>
              {isLive && !editingMeta && (
                <button onClick={() => { setEditTitle(title); setEditCat(category); setEditingMeta(true); }}
                  style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(6,182,212,0.6)", background: "none", border: "none", cursor: "pointer" }}>
                  Edit live ✏
                </button>
              )}
            </div>
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Mid-stream edit */}
              {isLive && editingMeta ? (
                <>
                  <Field label="Update Title">
                    <Inp value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                  </Field>
                  <Field label="Category">
                    <Sel value={editCat} onChange={e => setEditCat(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Sel>
                  </Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleUpdateMeta} style={{ flex: 1, padding: "8px", borderRadius: 7, fontFamily: "JetBrains Mono", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", color: "#22d3ee", transition: "all 0.2s" }}>
                      Save Changes
                    </button>
                    <button onClick={() => setEditingMeta(false)} style={{ flex: 1, padding: "8px", borderRadius: 7, fontFamily: "JetBrains Mono", fontSize: "0.7rem", cursor: "pointer", background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", color: "#64748b", transition: "all 0.2s" }}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Field label="Title *">
                    <Inp value={title} onChange={e => setTitle(e.target.value)} disabled={isLive} placeholder="Building a REST API from scratch…" maxLength={80} />
                    {!isLive && <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.53rem", color: "rgba(100,116,139,0.3)", textAlign: "right" }}>{title.length}/80</span>}
                  </Field>

                  <Field label="Description">
                    <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={isLive} rows={2} placeholder="What are you coding today?" style={{ ...INP(isLive), resize: "none", lineHeight: 1.5 }}
                      onFocus={e => { if (!isLive) { e.target.style.borderColor = "rgba(6,182,212,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; } }}
                      onBlur={e => { e.target.style.borderColor = "rgba(6,182,212,0.18)"; e.target.style.boxShadow = "none"; }}
                    />
                  </Field>

                  <Field label="Category">
                    <Sel value={category} onChange={e => setCategory(e.target.value)} disabled={isLive}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Sel>
                  </Field>

                  <Field label="Tags (comma separated, max 5)">
                    <Inp value={tagsInput} onChange={e => setTagsInput(e.target.value)} disabled={isLive} placeholder="React, Node, TypeScript" />
                    {tagsInput && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                        {tagsInput.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5).map(tag => (
                          <span key={tag} style={{ fontFamily: "JetBrains Mono", fontSize: "0.57rem", color: "rgba(6,182,212,0.7)", background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)", padding: "1px 7px", borderRadius: 4 }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* ── Technical (pre-live only) ── */}
          {!isLive && (
            <Section title="Technical Setup">
              <Field label="Camera">
                <Sel value={selCamera} onChange={e => setSelCamera(e.target.value)}>
                  {videoDevices.length === 0 && <option value="">No camera detected</option>}
                  {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</option>)}
                </Sel>
              </Field>
              <Field label="Microphone">
                <Sel value={selMic} onChange={e => setSelMic(e.target.value)}>
                  {audioDevices.length === 0 && <option value="">No mic detected</option>}
                  {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</option>)}
                </Sel>
              </Field>
              <AudioMeter stream={micStream} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Resolution">
                  <Sel value={resolution} onChange={e => setResolution(Number(e.target.value))}>
                    {RESOLUTIONS.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
                  </Sel>
                </Field>
                <Field label="FPS">
                  <Sel value={fps} onChange={e => setFps(Number(e.target.value))}>
                    {FPS_OPTIONS.map(f => <option key={f} value={f}>{f} fps</option>)}
                  </Sel>
                </Field>
              </div>
              <Field label="Bitrate">
                <Sel value={bitrate} onChange={e => setBitrate(e.target.value)}>
                  {BITRATE_OPTIONS.map(b => <option key={b} value={b}>{b === "Auto" ? "Auto (recommended)" : `${b} kbps`}</option>)}
                </Sel>
              </Field>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Dot ok={netOk} label={netOk === null ? "Network not tested" : netOk ? "Network OK" : "Network weak"} />
                <button onClick={runNetworkTest} disabled={netTesting} style={{ marginLeft: "auto", ...ctrlBtn(!netTesting, false), padding: "5px 10px", fontSize: "0.6rem" }}>
                  {netTesting ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={10} />}
                  {netTesting ? "…" : "Test"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Chat & safety ── */}
          <Section title="Chat & Safety" defaultOpen={!isLive}>
            <Toggle on={chatEnabled} onToggle={() => { const n = !chatEnabled; setChatEnabled(n); if (isLive) pushChatSettings({ chatEnabled: n }); }} label="Enable chat" desc="Allow viewers to send messages" />
            <Toggle on={slowMode} onToggle={() => { const n = !slowMode; setSlowMode(n); if (isLive) pushChatSettings({ slowMode: n }); }} label="Slow mode" desc={`${slowModeDelay}s cooldown between messages`} />
            <Toggle on={followersOnly} onToggle={() => { const n = !followersOnly; setFollowersOnly(n); if (isLive) pushChatSettings({ followersOnlyChat: n }); }} label="Followers only" desc="Restrict chat to followers" />
            {slowMode && (
              <Field label="Slow mode delay (seconds)">
                <Sel value={slowModeDelay} onChange={e => { const n = Number(e.target.value); setSlowModeDelay(n); if (isLive) pushChatSettings({ slowModeDelay: n }); }}>
                  {[5, 10, 15, 30, 60].map(d => <option key={d} value={d}>{d}s</option>)}
                </Sel>
              </Field>
            )}
          </Section>

          {/* ── Privacy (pre-live) ── */}
          {!isLive && (
            <Section title="Privacy" defaultOpen={false}>
              <Field label="Audience">
                <Sel value={privacy} onChange={e => setPrivacy(e.target.value)}>
                  <option value="public">Public — visible to everyone</option>
                  <option value="followers">Followers only</option>
                  <option value="private">Private — unlisted</option>
                </Sel>
              </Field>
            </Section>
          )}

          {/* ── GO LIVE / END STREAM ── */}
          <div>
            {!isLive ? (
              <>
                <button
                  onClick={handleGoLive}
                  disabled={isStarting || !title.trim()}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 9,
                    background: "linear-gradient(135deg,rgba(239,68,68,0.88),rgba(220,38,38,0.96))",
                    border: "1px solid rgba(239,68,68,0.5)", color: "#fff",
                    fontFamily: "JetBrains Mono", fontSize: "0.82rem", fontWeight: 800,
                    letterSpacing: "0.1em", cursor: isStarting || !title.trim() ? "not-allowed" : "pointer",
                    opacity: isStarting || !title.trim() ? 0.45 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    boxShadow: title.trim() ? "0 0 24px rgba(239,68,68,0.35),0 8px 30px rgba(0,0,0,0.4)" : "none",
                    transition: "all 0.22s",
                  }}
                  onMouseEnter={e => { if (title.trim() && !isStarting) { e.currentTarget.style.boxShadow = "0 0 40px rgba(239,68,68,0.6),0 8px 40px rgba(0,0,0,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = title.trim() ? "0 0 24px rgba(239,68,68,0.35),0 8px 30px rgba(0,0,0,0.4)" : "none"; e.currentTarget.style.transform = "none"; }}
                >
                  {isStarting ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Starting…</> : <><Radio size={15} /> GO LIVE</>}
                </button>
                <p style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: "0.58rem", color: "rgba(100,116,139,0.3)", marginTop: 8, letterSpacing: "0.06em" }}>
                  {source === "screen" || source === "both" ? "Browser will ask for screen permission" : "Browser will ask for camera & mic permission"}
                </p>
              </>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  width: "100%", padding: "13px", borderRadius: 9,
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", fontFamily: "JetBrains Mono", fontSize: "0.82rem",
                  fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; e.currentTarget.style.boxShadow = "0 0 18px rgba(239,68,68,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Square size={15} /> END STREAM
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}