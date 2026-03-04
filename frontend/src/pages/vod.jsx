// src/pages/Vod.jsx  —  YouTube-style VOD detail page
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    PlayCircle, Clock, Eye, Tag, ChevronLeft, Share2,
    Search, Sparkles, ThumbsUp, Trash2, Send, RefreshCw,
    CornerDownRight, MessageSquare, AlertCircle, CheckCircle2,
    Loader2, Film, Calendar, User,
} from "lucide-react";

import { useGetVodQuery, useGetAllVodsQuery, useLazySearchVodQuery } from "../features/vod/vodApi";
import {
    useGetNotesQuery,
    useCreateNoteMutation,
    useUpvoteNoteMutation,
    useDeleteNoteMutation,
} from "../features/note/noteApi";
import { selectCurrentUser, selectIsAuthenticated } from "../features/auth/authSlice";
import { formatTimestamp, formatDuration, formatDate, formatViewers } from "../utils/formatters";
import Spinner from "../components/layout/ui/Spinner";

/* ─── Avatar helper ─────────────────────────────────────────── */
function Avatar({ user, size = 8, onClick }) {
    const initials = (user?.username || user?.name || "?")[0]?.toUpperCase();
    const sz = `w-${size} h-${size}`;
    return (
        <button
            onClick={onClick}
            title={`View ${user?.username || user?.name}'s profile`}
            className={`${sz} rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20
        flex items-center justify-center flex-shrink-0 text-cyan-300 font-bold font-mono
        ${onClick ? "hover:border-cyan-400/50 hover:scale-105 transition-all cursor-pointer" : "cursor-default"}
        text-xs leading-none`}
            style={{ fontSize: size <= 7 ? "0.6rem" : "0.75rem" }}
        >
            {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                : initials}
        </button>
    );
}

/* ─── AI Search result card ─────────────────────────────────── */
function SearchResult({ result, onSeek }) {
    return (
        <button
            onClick={() => onSeek(result.start)}
            className="w-full text-left p-3 rounded-xl bg-dark-800 border border-dark-600
        hover:border-cyan-500/40 hover:bg-dark-700 transition-all group"
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    {formatTimestamp(result.start)}
                </span>
                <div className="flex-1 h-px bg-dark-500" />
                <span className="text-xs font-mono text-slate-600">{result.similarity}% match</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 leading-relaxed line-clamp-3 transition-colors">
                {result.text}
            </p>
        </button>
    );
}

/* ─── Comment / Note card with replies ──────────────────────── */
function NoteCard({ note, vodId, currentUserId, onSeek, onNavigateProfile }) {
    const [upvote] = useUpvoteNoteMutation();
    const [remove] = useDeleteNoteMutation();
    const [createNote] = useCreateNoteMutation();
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [postingReply, setPostingReply] = useState(false);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setPostingReply(true);
        try {
            await createNote({ vodId, timestamp: note.timestamp, content: `↩ @${note.authorId?.username}: ${replyText}` });
            setReplyText("");
            setShowReply(false);
        } finally { setPostingReply(false); }
    };

    return (
        <div className="group flex gap-3">
            {/* Avatar — click goes to profile */}
            <Avatar
                user={note.authorId}
                size={8}
                onClick={() => onNavigateProfile(note.authorId?.username || note.authorId?.name)}
            />

            <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <button
                        onClick={() => onNavigateProfile(note.authorId?.username || note.authorId?.name)}
                        className="text-xs font-bold text-slate-200 hover:text-cyan-400 transition-colors font-mono"
                    >
                        {note.authorId?.username || note.authorId?.name}
                    </button>
                    <button
                        onClick={() => onSeek(note.timestamp)}
                        className="text-xs font-mono text-cyan-500/70 hover:text-cyan-400 bg-cyan-500/8 px-1.5 py-0.5 rounded transition-colors"
                    >
                        <Clock size={9} className="inline mr-1" />
                        {formatTimestamp(note.timestamp)}
                    </button>
                </div>

                {/* Body */}
                <p className="text-sm text-slate-300 leading-relaxed mb-2 break-words">{note.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => upvote(note._id)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors font-mono"
                    >
                        <ThumbsUp size={11} />
                        {note.upvoteCount || 0}
                    </button>

                    {currentUserId && (
                        <button
                            onClick={() => setShowReply(p => !p)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
                        >
                            <CornerDownRight size={11} />
                            Reply
                        </button>
                    )}

                    {currentUserId && note.authorId?._id === currentUserId && (
                        <button
                            onClick={() => remove(note._id)}
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors font-mono ml-auto opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={11} /> Delete
                        </button>
                    )}
                </div>

                {/* Reply input */}
                {showReply && (
                    <div className="mt-2 flex gap-2 items-start">
                        <input
                            autoFocus
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                            placeholder={`Reply to ${note.authorId?.username}…`}
                            className="flex-1 bg-dark-700 border border-dark-500 rounded-lg px-3 py-1.5 text-xs text-slate-200
                placeholder-slate-600 font-mono outline-none focus:border-cyan-500/50 transition-all"
                        />
                        <button
                            onClick={handleReply}
                            disabled={postingReply || !replyText.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30
                text-cyan-400 text-xs font-mono font-bold hover:bg-cyan-500/20 disabled:opacity-40 transition-all"
                        >
                            {postingReply ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Similar VOD card ──────────────────────────────────────── */
function SimilarVodCard({ vod, onClick }) {
    if (!vod) return null;
    return (
        <button
            onClick={onClick}
            className="w-full flex gap-3 p-2 rounded-xl hover:bg-dark-700 transition-all group text-left"
        >
            {/* Thumbnail */}
            <div className="w-28 h-16 flex-shrink-0 rounded-lg bg-dark-700 border border-dark-600 overflow-hidden
        flex items-center justify-center relative">
                {vod.thumbnailUrl
                    ? <img src={vod.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    : <Film size={20} className="text-slate-600" />
                }
                {/* Duration badge */}
                {vod.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded">
                        {formatDuration(vod.duration)}
                    </span>
                )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-2 leading-snug mb-1 transition-colors">
                    {vod.title}
                </p>
                <p className="text-xs text-slate-500 font-mono">{vod.streamerId?.username || vod.streamerId?.name}</p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                    {formatViewers(vod.views)} views · {formatDate(vod.createdAt)}
                </p>
            </div>
        </button>
    );
}

/* ══════════════════ MAIN PAGE ══════════════════ */
export default function VodDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const isAuth = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);

    /* ── Data ── */
    const { data: vodData, isLoading: vodLoading, isError: vodError } = useGetVodQuery(id);
    const { data: noteData, isLoading: notesLoading } = useGetNotesQuery(id);
    const { data: allVodsData } = useGetAllVodsQuery({});
    const [triggerSearch, { data: searchData, isFetching: searching }] = useLazySearchVodQuery();
    const [createNote, { isLoading: creatingNote }] = useCreateNoteMutation();

    /* ── State ── */
    const [tab, setTab] = useState("comments");  // "comments" | "search"
    const [searchQuery, setSearchQuery] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteTs, setNoteTs] = useState(0);
    const [signedUrl, setSignedUrl] = useState("");
    const [showDesc, setShowDesc] = useState(false);
    const [copied, setCopied] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [retryMsg, setRetryMsg] = useState("");

    const vod = vodData?.vod;
    const notes = noteData?.notes ?? [];
    const similar = allVodsData?.vods?.filter(v => v._id !== id).slice(0, 10) ?? [];

    /* ── Fetch signed video URL ── */
    useEffect(() => {
        if (!vod?._id || !vod?.videoUrl) return;
        const token = localStorage.getItem("token");
        fetch(`${import.meta.env.VITE_API_URL}/vods/${vod._id}/video-url`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(r => r.json())
            .then(d => { if (d.success && d.videoUrl) setSignedUrl(d.videoUrl); })
            .catch(() => setSignedUrl(vod.videoUrl));
    }, [vod?._id]);

    /* ── Helpers ── */
    const seekTo = (s) => { if (videoRef.current) { videoRef.current.currentTime = s; videoRef.current.play(); } };
    const captureTs = () => setNoteTs(Math.floor(videoRef.current?.currentTime ?? 0));

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        await createNote({ vodId: id, timestamp: noteTs, content: noteContent });
        setNoteContent("");
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        triggerSearch({ id, q: searchQuery });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToProfile = (username) => {
        if (username) navigate(`/u/${username}`);
    };

    const handleRetranscribe = async () => {
        setRetrying(true); setRetryMsg("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/vods/${id}/retranscribe`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setRetryMsg(data.success ? "✅ Queued! Refresh in ~1 minute." : `❌ ${data.message}`);
        } catch { setRetryMsg("❌ Failed to reach server."); }
        finally { setRetrying(false); }
    };

    /* ── Loading / error ── */
    if (vodLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={36} className="text-cyan-500 animate-spin" />
                <p className="text-slate-500 font-mono text-sm">Loading VOD…</p>
            </div>
        </div>
    );

    if (vodError || !vod) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="w-20 h-20 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
                <Film size={32} className="text-slate-600" />
            </div>
            <div className="text-center">
                <p className="text-slate-300 font-semibold mb-1">VOD not found</p>
                <p className="text-slate-500 text-sm font-mono">This video may have been deleted or doesn't exist.</p>
            </div>
            <button
                onClick={() => navigate("/vods")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30
          text-cyan-400 text-sm font-mono font-bold hover:bg-cyan-500/20 transition-all"
            >
                <ChevronLeft size={14} /> Browse VODs
            </button>
        </div>
    );

    // Use toString() on both sides — vod.streamerId may be a populated object or raw ObjectId string
    const isOwner = isAuth && (
        vod.streamerId?._id?.toString() === currentUser?._id?.toString() ||
        vod.streamerId?.toString() === currentUser?._id?.toString()
    );
    const aiReady = vod.transcriptionStatus === "done";

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="max-w-[1400px] mx-auto px-4 py-5">

            {/* Back row */}
            <button
                onClick={() => navigate("/vods")}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 font-mono mb-4 transition-colors group"
            >
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to VODs
            </button>

            {/* ══ Main 3-column grid ══ */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

                {/* ════ LEFT — Video + Info + Comments ════ */}
                <div className="flex flex-col gap-5 min-w-0">

                    {/* ── Video player ── */}
                    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                        {signedUrl ? (
                            <video ref={videoRef} src={signedUrl} controls className="w-full h-full" />
                        ) : vod.videoUrl && !signedUrl ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <Loader2 size={32} className="text-cyan-500 animate-spin" />
                                <p className="text-slate-400 font-mono text-sm">Loading video…</p>
                            </div>
                        ) : vod.transcriptionStatus === "failed" && !vod.videoUrl ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                                <AlertCircle size={44} className="text-red-400" />
                                <div>
                                    <p className="text-red-300 font-bold mb-1">Recording unavailable</p>
                                    <p className="text-slate-500 text-sm font-mono max-w-xs leading-relaxed">
                                        The stream was too short or the recording failed to save.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 size={32} className="text-cyan-500 animate-spin" />
                                <div className="text-center">
                                    <p className="text-slate-400 font-mono text-sm">Processing video…</p>
                                    <p className="text-slate-600 font-mono text-xs mt-1">Check back in a few minutes</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Title & Meta ── */}
                    <div>
                        <h1 className="text-xl font-bold text-white leading-snug mb-3">{vod.title}</h1>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                            {/* Left: streamer + stats */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => goToProfile(vod.streamerId?.username || vod.streamerId?.name)}
                                    className="flex items-center gap-2.5 group"
                                >
                                    <Avatar user={vod.streamerId} size={9} />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors font-mono">
                                            {vod.streamerId?.username || vod.streamerId?.name}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono">Streamer</p>
                                    </div>
                                </button>

                                <div className="h-4 w-px bg-dark-600" />

                                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                                    <span className="flex items-center gap-1"><Eye size={11} />{formatViewers(vod.views)} views</span>
                                    <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(vod.duration)}</span>
                                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(vod.createdAt)}</span>
                                </div>
                            </div>

                            {/* Right: badges + share */}
                            <div className="flex items-center gap-2">
                                {aiReady && (
                                    <span className="flex items-center gap-1.5 text-xs font-mono text-cyan-400
                    bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                                        <Sparkles size={10} /> AI Search ready
                                    </span>
                                )}
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold
                    bg-dark-700 border border-dark-500 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                                >
                                    {copied ? <><CheckCircle2 size={11} /> Copied!</> : <><Share2 size={11} /> Share</>}
                                </button>
                            </div>
                        </div>

                        {/* Tags */}
                        {vod.tags?.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mt-3">
                                {vod.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 text-xs font-mono text-slate-500
                    bg-dark-800 border border-dark-600 px-2 py-0.5 rounded-full hover:border-dark-400 transition-colors">
                                        <Tag size={9} />{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description (collapsible) */}
                        {vod.description && (
                            <div className="mt-3 bg-dark-800/60 border border-dark-600 rounded-xl p-4">
                                <p className={`text-sm text-slate-400 leading-relaxed ${showDesc ? "" : "line-clamp-2"}`}>
                                    {vod.description}
                                </p>
                                <button
                                    onClick={() => setShowDesc(p => !p)}
                                    className="text-xs font-mono text-slate-500 hover:text-slate-300 mt-1 transition-colors"
                                >
                                    {showDesc ? "Show less" : "Show more"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Comments / AI Search tabs ── */}
                    <div className="border border-dark-600 rounded-2xl overflow-hidden bg-dark-800/40">

                        {/* Tab bar */}
                        <div className="flex border-b border-dark-600">
                            {[
                                { key: "comments", icon: MessageSquare, label: `Comments (${notes.length})` },
                                { key: "search", icon: Sparkles, label: "AI Search", disabled: !aiReady },
                            ].map(({ key, icon: Icon, label, disabled }) => (
                                <button
                                    key={key}
                                    onClick={() => !disabled && setTab(key)}
                                    disabled={disabled}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all
                    ${tab === key
                                            ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5"
                                            : disabled
                                                ? "text-slate-600 cursor-not-allowed"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-dark-700/50"}`}
                                >
                                    <Icon size={13} />
                                    {label}
                                    {disabled && key === "search" && (
                                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                                            {vod.transcriptionStatus === "failed" ? "failed" :
                                                vod.transcriptionStatus === "processing" ? "…" : "pending"}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Transcription banners (show in both tabs) */}
                        {vod.transcriptionStatus === "failed" && (
                            <div className="mx-4 mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                                    <p className="text-xs font-bold text-red-400 font-mono">AI transcription failed</p>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">
                                    {retryMsg || "Previous attempt errored. Click retry to run again with the fixed model."}
                                </p>
                                {isOwner && !retryMsg?.startsWith("✅") && (
                                    <button
                                        onClick={handleRetranscribe}
                                        disabled={retrying}
                                        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold
                      bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
                                    >
                                        {retrying
                                            ? <><Loader2 size={10} className="animate-spin" /> Queuing…</>
                                            : <><RefreshCw size={10} /> Retry AI Transcription</>}
                                    </button>
                                )}
                                {retryMsg?.startsWith("✅") && (
                                    <p className="text-xs font-mono text-green-400 flex items-center gap-1">
                                        <CheckCircle2 size={11} />{retryMsg}
                                    </p>
                                )}
                            </div>
                        )}
                        {(vod.transcriptionStatus === "processing" || vod.transcriptionStatus === "pending") && (
                            <div className="mx-4 mt-4 p-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 flex items-center gap-3">
                                <Loader2 size={14} className="text-cyan-500 animate-spin flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-cyan-400 font-mono">AI transcription running…</p>
                                    <p className="text-xs text-slate-500 font-mono">AI Search unlocks when done. Refresh to check.</p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 flex flex-col gap-4">

                            {/* ── COMMENTS tab ── */}
                            {tab === "comments" && (
                                <>
                                    {/* Add comment */}
                                    {isAuth ? (
                                        <form onSubmit={handleAddNote} className="flex gap-3 items-start">
                                            <Avatar user={currentUser} size={9} />
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-mono text-slate-500">
                                                        Commenting at{" "}
                                                        <button type="button" onClick={captureTs}
                                                            className="text-cyan-400 hover:underline">
                                                            {formatTimestamp(noteTs)}
                                                        </button>
                                                        {" "}—{" "}
                                                        <button type="button" onClick={captureTs}
                                                            className="text-slate-400 hover:text-slate-200 transition-colors">
                                                            capture timestamp
                                                        </button>
                                                    </p>
                                                </div>
                                                <textarea
                                                    value={noteContent}
                                                    onChange={e => setNoteContent(e.target.value)}
                                                    placeholder="Add a comment…"
                                                    rows={2}
                                                    className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-sm
                            text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50
                            focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setNoteContent("")}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button type="submit" disabled={creatingNote || !noteContent.trim()}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30
                              text-cyan-400 text-xs font-mono font-bold disabled:opacity-40 hover:bg-cyan-500/25 transition-all">
                                                        <Send size={11} />
                                                        {creatingNote ? "Posting…" : "Comment"}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-dark-700 border border-dark-600">
                                            <User size={16} className="text-slate-500" />
                                            <p className="text-sm text-slate-400">
                                                <button onClick={() => navigate("/login")} className="text-cyan-400 hover:underline font-semibold">
                                                    Sign in
                                                </button>{" "}
                                                to leave a comment
                                            </p>
                                        </div>
                                    )}

                                    {/* Comments list */}
                                    <div className="flex flex-col gap-5">
                                        {notesLoading ? (
                                            <div className="flex justify-center py-10"><Spinner /></div>
                                        ) : notes.length === 0 ? (
                                            <div className="flex flex-col items-center py-12 gap-3 text-center">
                                                <MessageSquare size={36} className="text-slate-700" />
                                                <p className="text-slate-400 font-semibold">No comments yet</p>
                                                <p className="text-slate-600 text-sm font-mono">Be the first to share your thoughts!</p>
                                            </div>
                                        ) : (
                                            notes.map(note => (
                                                <NoteCard
                                                    key={note._id}
                                                    note={note}
                                                    vodId={id}
                                                    currentUserId={currentUser?._id}
                                                    onSeek={seekTo}
                                                    onNavigateProfile={goToProfile}
                                                />
                                            ))
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── AI SEARCH tab ── */}
                            {tab === "search" && (
                                <div className="flex flex-col gap-4">
                                    <form onSubmit={handleSearch} className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search this VOD — e.g. 'explain hooks'…"
                                            className="w-full bg-dark-700 border border-dark-500 rounded-xl pl-9 pr-4 py-3 text-sm
                        text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50
                        focus:ring-1 focus:ring-cyan-500/20 transition-all"
                                        />
                                    </form>

                                    {searching ? (
                                        <div className="flex justify-center py-10"><Spinner /></div>
                                    ) : searchData?.results?.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-slate-500 font-mono">{searchData.results.length} results</p>
                                            {searchData.results.map((r, i) => (
                                                <SearchResult key={i} result={r} onSeek={seekTo} />
                                            ))}
                                        </div>
                                    ) : searchData?.results?.length === 0 ? (
                                        <div className="flex flex-col items-center py-10 gap-3">
                                            <Sparkles size={32} className="text-slate-700" />
                                            <p className="text-slate-400 font-semibold">No matches found</p>
                                            <p className="text-slate-600 text-sm font-mono">Try different keywords</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-10 gap-3 text-center">
                                            <Sparkles size={32} className="text-cyan-900" />
                                            <p className="text-slate-300 font-semibold">AI-powered transcript search</p>
                                            <p className="text-slate-500 text-sm font-mono max-w-sm leading-relaxed">
                                                Search by topic or phrase and jump to the exact moment in the video
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ════ RIGHT — Similar VODs ════ */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-300 font-mono px-1">Up next</h3>

                    {similar.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3 text-center bg-dark-800/40 rounded-2xl border border-dark-600">
                            <Film size={32} className="text-slate-700" />
                            <p className="text-slate-400 font-semibold text-sm">No more VODs</p>
                            <p className="text-slate-600 text-xs font-mono leading-relaxed px-4">
                                Start a stream to create more VODs.<br />They'll appear here.
                            </p>
                            <button
                                onClick={() => navigate("/go-live")}
                                className="mt-1 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30
                  text-cyan-400 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-all"
                            >
                                Go Live →
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {similar.map(v => (
                                <SimilarVodCard
                                    key={v._id}
                                    vod={v}
                                    onClick={() => navigate(`/vods/${v._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
