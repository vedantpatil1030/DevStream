// src/pages/Home.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Users, Search, Cpu, Code2, Wifi } from "lucide-react";

import { useGetAllStreamsQuery } from "../features/stream/streamApi";
import Spinner from "../components/layout/ui/Spinner";

const CATEGORIES = ["All", "Frontend", "Backend", "AI/ML", "DevOps", "Systems", "Open Source"];

// ── Stream Card ──────────────────────────────────────────────────────────────
function StreamCard({ stream }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const formatViewers = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;

  const initial = stream.streamerId?.name?.[0]?.toUpperCase() ?? "?";
  const username = stream.streamerId?.name ?? "streamer";

  return (
    <div
      onClick={() => navigate(`/stream/${stream._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(6,182,212,0.05)"
          : "rgba(5,8,16,0.7)",
        border: `1px solid ${hovered ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.1)"}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered
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
        {/* code bg decoration */}
        <div style={{
          position: "absolute", inset: 0,
          fontFamily: "JetBrains Mono",
          fontSize: "0.6rem",
          color: "rgba(6,182,212,0.12)",
          padding: "10px",
          lineHeight: 1.8,
          overflow: "hidden",
          userSelect: "none",
          whiteSpace: "pre",
        }}>
          {`const stream = await devstream
  .connect("${username}")
  .start({ hd: true, mono: false })
  .then(s => s.broadcast())

// viewers: ${formatViewers(stream.viewerCount ?? 0)}
// tags: ${stream.tags?.join(", ") ?? ""}`}
        </div>

        {/* Scan line */}
        {hovered && (
          <div style={{
            position: "absolute", left: 0, right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)",
            animation: "scanLine 1.5s linear infinite",
            pointerEvents: "none",
          }} />
        )}

        {/* Avatar */}
        <div style={{
          width: 50, height: 50, borderRadius: "50%", zIndex: 2,
          background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))",
          border: `2px solid ${hovered ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.25)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "JetBrains Mono",
          fontWeight: 700, fontSize: "1rem",
          color: "#22d3ee",
          boxShadow: hovered ? "0 0 18px rgba(6,182,212,0.35)" : "none",
          transition: "all 0.25s",
        }}>
          {initial}
        </div>

        {/* Live badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.4)",
          color: "#f87171",
          fontFamily: "JetBrains Mono",
          fontWeight: 700, fontSize: "0.6rem",
          letterSpacing: "0.1em",
          padding: "2px 8px", borderRadius: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
            animation: "flicker 2s infinite",
            boxShadow: "0 0 6px #ef4444",
          }} />
          LIVE
        </div>

        {/* Viewer count */}
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(2,4,8,0.75)",
          border: "1px solid rgba(6,182,212,0.15)",
          color: "#94a3b8",
          fontFamily: "JetBrains Mono",
          fontSize: "0.6rem",
          padding: "2px 8px", borderRadius: 4,
          backdropFilter: "blur(4px)",
        }}>
          <Users size={9} color="#22d3ee" />
          {formatViewers(stream.viewerCount ?? 0)} watching
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px" }}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/u/${username}`);
          }}
          style={{ 
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.08)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "rgba(6,182,212,0.12)",
            border: "1px solid rgba(6,182,212,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "JetBrains Mono",
              fontSize: "0.6rem", fontWeight: 700,
              color: "#22d3ee",
            }}>
              {initial}
            </span>
          </div>
          <span style={{
            fontFamily: "JetBrains Mono",
            fontSize: "0.65rem",
            color: "rgba(148,163,184,0.5)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.2s",
          }}>
            {username}
          </span>
        </div>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: hovered ? "#e2e8f0" : "#cbd5e1",
          lineHeight: 1.4,
          marginBottom: 10,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          transition: "color 0.2s",
        }}>
          {stream.title}
        </p>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {stream.tags?.slice(0, 3).map((tag) => (
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
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useGetAllStreamsQuery({ category, search: query });

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem 1.5rem", width: "100%" }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: "2.5rem", animation: "slideUp 0.6s ease both" }}>

        {/* live indicator */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 20, padding: "4px 14px",
          marginBottom: "1.25rem",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#ef4444",
            boxShadow: "0 0 8px #ef4444",
            animation: "flicker 2s infinite",
          }} />
          <span style={{
            fontFamily: "JetBrains Mono",
            fontSize: "0.65rem", fontWeight: 700,
            color: "#f87171", letterSpacing: "0.1em",
          }}>
            {data?.count || 0} DEVELOPERS LIVE
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
          Watch developers{" "}
          <span style={{
            background: "linear-gradient(90deg, #22d3ee, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            build in real-time.
          </span>
        </h1>

        <p style={{
          fontFamily: "JetBrains Mono",
          fontSize: "0.8rem",
          color: "rgba(100,116,139,0.8)",
          letterSpacing: "0.03em",
        }}>
          <span style={{ color: "#4ade80" }}>//</span>{" "}
          live coding streams · AI-powered search · collaborative tools
        </p>

        {/* stats row */}
        <div style={{
          display: "flex", gap: 24, marginTop: "1.5rem", flexWrap: "wrap",
        }}>
          {[
            { icon: Cpu, label: "Avg FPS", val: "60" },
            { icon: Wifi, label: "Latency", val: "< 1s" },
            { icon: Code2, label: "Languages", val: "24+" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(5,8,16,0.6)",
              border: "1px solid rgba(6,182,212,0.1)",
              borderRadius: 8, padding: "6px 14px",
              backdropFilter: "blur(8px)",
            }}>
              <Icon size={13} color="rgba(6,182,212,0.6)" />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "#64748b" }}>{label}:</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", fontWeight: 700, color: "#22d3ee" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 420, marginBottom: "1.5rem" }}>
        <Search size={14} style={{
          position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)", color: "rgba(6,182,212,0.4)",
          pointerEvents: "none",
        }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search_streams('keyword')..."
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

      {/* ── Stream Grid ── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "#64748b" }}>
            <span style={{ color: "#f87171" }}>Error:</span> failed to fetch streams
          </p>
        </div>
      ) : data?.streams?.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <Radio size={36} style={{ color: "rgba(6,182,212,0.2)", margin: "0 auto 1rem" }} />
          <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "#64748b" }}>
            // no active streams right now
          </p>
          <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.5)", marginTop: 6 }}>
            {'>'} be the first to go live!
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.2rem",
        }}>
          {data?.streams?.map((stream) => (
            <StreamCard key={stream._id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}