// src/pages/Vods.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Search, Clock, Eye, Film, Sparkles } from "lucide-react";

import { useGetAllVodsQuery } from "../features/vod/vodApi";
import { formatDuration, formatDate, formatViewers } from "../utils/formatters";
import Spinner from "../components/layout/ui/Spinner";

const CATEGORIES = ["All", "Frontend", "Backend", "AI/ML", "DevOps", "Systems", "Open Source"];

// ─── VOD Card ────────────────────────────────────────────────────
function VodCard({ vod }) {
    const navigate = useNavigate();
    const [hov, setHov] = useState(false);

    return (
        <div
            onClick={() => navigate(`/vods/${vod._id}`)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? "rgba(6,182,212,0.05)" : "rgba(5,8,16,0.7)",
                border: `1px solid ${hov ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.1)"}`,
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.25s",
                transform: hov ? "translateY(-3px)" : "none",
                boxShadow: hov
                    ? "0 0 24px rgba(6,182,212,0.15), 0 12px 40px rgba(0,0,0,0.5)"
                    : "0 4px 20px rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            {/* Thumbnail */}
            <div style={{
                height: 148,
                background: "linear-gradient(135deg, #050810 0%, #0d1424 100%)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                {/* code-bg decoration */}
                <div style={{
                    position: "absolute", inset: 0,
                    fontFamily: "JetBrains Mono",
                    fontSize: "0.6rem",
                    color: "rgba(6,182,212,0.08)",
                    padding: 10,
                    lineHeight: 1.8,
                    overflow: "hidden",
                    userSelect: "none",
                    whiteSpace: "pre",
                }}>
                    {`// ${vod.title}\nconst vod = await devstream\n  .play("${vod.streamerId?.username ?? "streamer"}")\n  .duration(${vod.duration ?? 0}s)\n\n// views: ${vod.views ?? 0}`}
                </div>

                {/* Center icon */}
                <Film size={36} color="rgba(6,182,212,0.2)" style={{ zIndex: 1 }} />

                {/* Duration badge */}
                <div style={{
                    position: "absolute", bottom: 8, right: 8,
                    display: "flex", alignItems: "center", gap: 4,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(4px)",
                    color: "#94a3b8",
                    fontFamily: "JetBrains Mono",
                    fontSize: "0.6rem",
                    padding: "2px 8px", borderRadius: 4,
                }}>
                    <Clock size={9} />
                    {formatDuration(vod.duration)}
                </div>

                {/* Status badge */}
                {vod.transcriptionStatus === "done" && (
                    <div style={{
                        position: "absolute", top: 8, left: 8,
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
                        color: "#38bdf8", fontFamily: "JetBrains Mono", fontWeight: 700,
                        fontSize: "0.58rem", letterSpacing: "0.06em",
                        padding: "2px 8px", borderRadius: 4,
                    }}>
                        <Sparkles size={9} /> AI Search
                    </div>
                )}
                {(vod.transcriptionStatus === "pending" || vod.transcriptionStatus === "processing") && !vod.videoUrl && (
                    <div style={{
                        position: "absolute", top: 8, left: 8,
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                        color: "#fbbf24", fontFamily: "JetBrains Mono", fontWeight: 700,
                        fontSize: "0.58rem", letterSpacing: "0.06em",
                        padding: "2px 8px", borderRadius: 4,
                    }}>
                        ⏳ Processing
                    </div>
                )}
                {vod.transcriptionStatus === "failed" && (
                    <div style={{
                        position: "absolute", top: 8, left: 8,
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", fontFamily: "JetBrains Mono", fontWeight: 700,
                        fontSize: "0.58rem", letterSpacing: "0.06em",
                        padding: "2px 8px", borderRadius: 4,
                    }}>
                        ✕ Unavailable
                    </div>
                )}            </div>

            {/* Info */}
            <div style={{ padding: "14px" }}>
                {/* Streamer row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(6,182,212,0.12)",
                        border: "1px solid rgba(6,182,212,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", fontWeight: 700, color: "#22d3ee" }}>
                            {vod.streamerId?.username?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "rgba(148,163,184,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {vod.streamerId?.username}
                    </span>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(100,116,139,0.4)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                        {formatDate(vod.createdAt)}
                    </span>
                </div>

                {/* Title */}
                <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: hov ? "#e2e8f0" : "#cbd5e1",
                    lineHeight: 1.4,
                    marginBottom: 10,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    transition: "color 0.2s",
                }}>
                    {vod.title}
                </p>

                {/* Tags + views */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1, overflow: "hidden" }}>
                        {vod.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} style={{
                                fontFamily: "JetBrains Mono",
                                fontSize: "0.58rem",
                                color: "rgba(6,182,212,0.6)",
                                background: "rgba(6,182,212,0.07)",
                                border: "1px solid rgba(6,182,212,0.15)",
                                padding: "1px 8px", borderRadius: 4,
                                letterSpacing: "0.04em",
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(100,116,139,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <Eye size={9} />
                        {formatViewers(vod.views)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function Vods() {
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");

    const { data, isLoading, isError } = useGetAllVodsQuery({ category, search: query });

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(search);
    };

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem 1.5rem", width: "100%" }}>

            {/* ── Hero header ── */}
            <div style={{ marginBottom: "2.5rem" }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(14,165,233,0.08)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    borderRadius: 20, padding: "4px 14px",
                    marginBottom: "1.25rem",
                }}>
                    <Film size={12} color="#38bdf8" />
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em" }}>
                        {data?.pagination?.total ?? 0} RECORDINGS
                    </span>
                </div>

                <h1 style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(2rem, 5vw, 3.25rem)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.03em",
                    marginBottom: "0.75rem",
                    color: "#f1f5f9",
                }}>
                    Past Streams &{" "}
                    <span style={{
                        background: "linear-gradient(90deg, #22d3ee, #a855f7)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        VODs
                    </span>
                </h1>

                <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "rgba(100,116,139,0.8)", letterSpacing: "0.03em" }}>
                    <span style={{ color: "#4ade80" }}>//</span>{" "}
                    searchable recordings · AI-powered timestamps · community notes
                </p>
            </div>

            {/* ── Search ── */}
            <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 420, marginBottom: "1.5rem" }}>
                <Search size={14} style={{
                    position: "absolute", left: 12, top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(6,182,212,0.4)",
                    pointerEvents: "none",
                }} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="search_vods('keyword')..."
                    style={{
                        width: "100%",
                        background: "rgba(5,8,16,0.75)",
                        border: "1px solid rgba(6,182,212,0.2)",
                        borderRadius: 8,
                        paddingLeft: "2.2rem", paddingRight: "0.85rem",
                        paddingTop: "0.6rem", paddingBottom: "0.6rem",
                        fontFamily: "JetBrains Mono",
                        fontSize: "0.75rem",
                        color: "#e2e8f0",
                        outline: "none",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.2s",
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = "rgba(6,182,212,0.5)";
                        e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.08), 0 0 14px rgba(6,182,212,0.12)";
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = "rgba(6,182,212,0.2)";
                        e.target.style.boxShadow = "none";
                    }}
                />
            </form>

            {/* ── Category Filters ── */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "2rem" }}>
                {CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            style={{
                                padding: "5px 14px",
                                borderRadius: 6,
                                fontFamily: "JetBrains Mono",
                                fontSize: "0.68rem",
                                fontWeight: active ? 700 : 500,
                                letterSpacing: "0.04em",
                                border: `1px solid ${active ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.12)"}`,
                                background: active ? "rgba(6,182,212,0.14)" : "rgba(5,8,16,0.5)",
                                color: active ? "#22d3ee" : "rgba(100,116,139,0.8)",
                                cursor: "pointer",
                                transition: "all 0.18s",
                                boxShadow: active ? "0 0 12px rgba(6,182,212,0.2)" : "none",
                            }}
                        >
                            {active ? `> ${cat}` : cat}
                        </button>
                    );
                })}
            </div>

            {/* ── Grid ── */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
                    <Spinner size="lg" />
                </div>
            ) : isError ? (
                <div style={{ textAlign: "center", padding: "5rem 0" }}>
                    <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "#64748b" }}>
                        <span style={{ color: "#f87171" }}>Error:</span> failed to fetch VODs
                    </p>
                </div>
            ) : data?.vods?.length === 0 ? (
                <div style={{ textAlign: "center", padding: "5rem 0" }}>
                    <Film size={36} style={{ color: "rgba(6,182,212,0.2)", margin: "0 auto 1rem" }} />
                    <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "#64748b" }}>
            // no VODs yet
                    </p>
                    <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.5)", marginTop: 6 }}>
                        {">"} VODs appear here after streams end
                    </p>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "1.2rem",
                }}>
                    {data?.vods?.map((vod) => (
                        <VodCard key={vod._id} vod={vod} />
                    ))}
                </div>
            )}
        </div>
    );
}