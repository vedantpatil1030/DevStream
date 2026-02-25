// src/components/layout/Navbar.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  logout,
  setCredentials,
} from "../../features/auth/authSlice";
import { Radio, LogOut, Terminal, Tv2, LayoutGrid, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

/* ─── CSS injected once ─────────────────────────────────────── */
const CSS = `
@keyframes navScan {
  0%   { transform: translateX(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateX(100vw); opacity: 0; }
}
@keyframes navGlow {
  0%,100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
@keyframes logoSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes livePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
}
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes borderFlow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes userBadgePop {
  0%   { transform: scale(0.9); }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;

function useInjectStyles(id, css) {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch { } };
  }, []);
}

/* ─── NavLink pill ─────────────────────────────────────────── */
function NavLink({ label, icon: Icon, path, active, onClick }) {
  const [hov, setHov] = useState(false);
  const lit = active || hov;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 8,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.72rem",
        fontWeight: active ? 700 : 500,
        letterSpacing: "0.04em",
        cursor: "pointer",
        border: "1px solid",
        borderColor: lit ? "rgba(6,182,212,0.4)" : "rgba(6,182,212,0.08)",
        background: active
          ? "rgba(6,182,212,0.12)"
          : hov
            ? "rgba(6,182,212,0.07)"
            : "transparent",
        color: lit ? "#22d3ee" : "rgba(148,163,184,0.65)",
        transition: "all 0.22s ease",
        boxShadow: active ? "0 0 12px rgba(6,182,212,0.2), inset 0 0 8px rgba(6,182,212,0.06)" : "none",
        overflow: "hidden",
      }}
    >
      {Icon && <Icon size={13} />}
      <span>{label}</span>

      {/* Active indicator bar */}
      {active && (
        <span style={{
          position: "absolute",
          bottom: 0,
          left: "15%",
          width: "70%",
          height: 2,
          borderRadius: 2,
          background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
          animation: "navGlow 2s ease-in-out infinite",
        }} />
      )}

      {/* Hover shimmer */}
      {hov && !active && (
        <span style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.06) 50%, transparent 100%)",
          borderRadius: 8,
          pointerEvents: "none",
        }} />
      )}
    </button>
  );
}

/* ─── Main Navbar ──────────────────────────────────────────── */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [logoHov, setLogoHov] = useState(false);
  const [time, setTime] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const fetchedRef = useRef(false);

  // ── Auto-heal: if token exists but Redux user is null, re-fetch ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || currentUser || fetchedRef.current) return;
    fetchedRef.current = true;

    // Use relative path so it goes through Vite proxy → no CORS, no port issues
    fetch("/api/auth/getme", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          dispatch(setCredentials({ user: data.user, token }));
        }
      })
      .catch(() => { }); // silent — don't block UI
  }, [currentUser, dispatch]);

  useInjectStyles("navbar-css", CSS);

  /* Live clock */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        n.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Periodic scan-line trigger */
  useEffect(() => {
    const id = setInterval(() => {
      setScanActive(true);
      setTimeout(() => setScanActive(false), 1600);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const isAt = (path) => location.pathname === path;

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Session terminated.");
    navigate("/");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(2,4,10,0.88)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        animation: "slideDown 0.4s ease both",
        overflow: "hidden",
      }}
    >
      {/* ── Animated RGB top border ─────────────────────────── */}
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, #06b6d4, #a855f7, #4ade80, #06b6d4)",
        backgroundSize: "300% 100%",
        animation: "borderFlow 4s linear infinite, navGlow 3s ease-in-out infinite",
      }} />

      {/* ── Scan sweep line (periodic) ───────────────────────── */}
      {scanActive && (
        <div style={{
          position: "absolute",
          top: 0, bottom: 0,
          width: 80,
          background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.12), transparent)",
          animation: "navScan 1.4s ease-in-out forwards",
          pointerEvents: "none",
          zIndex: 200,
        }} />
      )}

      {/* ── Bottom neon shadow line ──────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.25) 30%, rgba(168,85,247,0.2) 70%, transparent)",
        animation: "navGlow 4s ease-in-out infinite",
      }} />

      {/* ── Main row ────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 1.5rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>

        {/* ═══ LEFT: Logo ═══ */}
        <div
          onClick={() => navigate("/")}
          onMouseEnter={() => setLogoHov(true)}
          onMouseLeave={() => setLogoHov(false)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {/* Icon box */}
          <div style={{
            width: 34, height: 34,
            borderRadius: 9,
            background: "linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: logoHov
              ? "0 0 20px rgba(6,182,212,0.7), 0 0 40px rgba(168,85,247,0.3)"
              : "0 0 12px rgba(6,182,212,0.35)",
            transition: "box-shadow 0.3s",
            position: "relative",
            overflow: "hidden",
          }}>
            <Terminal size={17} color="#fff" />
            {/* inner rotating glow ring */}
            {logoHov && (
              <div style={{
                position: "absolute", inset: -4,
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: "50%",
                animation: "logoSpin 2s linear infinite",
                pointerEvents: "none",
              }} />
            )}
          </div>

          {/* Name + version */}
          <div style={{ lineHeight: 1 }}>
            <div style={{
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "0.03em",
              background: "linear-gradient(90deg,#22d3ee 0%,#c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transition: "filter 0.25s",
              filter: logoHov ? "brightness(1.3)" : "brightness(1)",
            }}>
              DevStream
            </div>
            <div style={{
              fontFamily: "JetBrains Mono",
              fontSize: "0.58rem",
              color: "rgba(6,182,212,0.45)",
              letterSpacing: "0.1em",
              marginTop: 1,
            }}>
              v2.0 · live
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Nav links ═══ */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flex: 1,
          justifyContent: "center",
        }}>
          <NavLink
            label="Browse"
            icon={LayoutGrid}
            path="/"
            active={isAt("/")}
            onClick={() => navigate("/")}
          />

          {isAuthenticated && (
            <NavLink
              label="Go Live"
              icon={Tv2}
              path="/go-live"
              active={isAt("/go-live")}
              onClick={() => navigate("/go-live")}
            />
          )}
        </div>

        {/* ═══ RIGHT: Auth + status ═══ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0,
        }}>

          {/* Live clock */}
          <div style={{
            fontFamily: "JetBrains Mono",
            fontSize: "0.62rem",
            color: "rgba(6,182,212,0.4)",
            letterSpacing: "0.08em",
            userSelect: "none",
            display: "none", // show on md+
          }}
            className="hidden md:block"
          >
            {time}
          </div>

          {/* LIVE badge (when authenticated) */}
          {isAuthenticated && (
            <button
              onClick={() => navigate("/go-live")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px",
                borderRadius: 7,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#f87171",
                fontFamily: "JetBrains Mono",
                fontWeight: 700,
                fontSize: "0.68rem",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.22s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.22)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.65)";
                e.currentTarget.style.boxShadow = "0 0 14px rgba(239,68,68,0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
                animation: "livePulse 1.5s infinite",
                display: "inline-block",
              }} />
              REC
            </button>
          )}

          {/* ── Authenticated user block ── */}
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Avatar + username */}
              <button
                onClick={() => {
                  const name = currentUser?.name;
                  if (!name) {
                    toast.error("Profile loading, try again in a second.");
                    return;
                  }
                  navigate(`/u/${name}`);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 9,
                  border: "1px solid rgba(6,182,212,0.2)",
                  background: "rgba(6,182,212,0.05)",
                  cursor: "pointer",
                  transition: "all 0.22s",
                  animation: "userBadgePop 0.4s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)";
                  e.currentTarget.style.background = "rgba(6,182,212,0.1)";
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(6,182,212,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)";
                  e.currentTarget.style.background = "rgba(6,182,212,0.05)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Avatar ring */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "linear-gradient(135deg, #06b6d4, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 800, fontSize: "0.68rem", color: "#fff",
                  boxShadow: "0 0 8px rgba(6,182,212,0.4)",
                  flexShrink: 0,
                }}>
                  {currentUser?.name?.[0]?.toUpperCase()}
                </div>
                <span style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  color: "#94a3b8",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {currentUser?.name}
                </span>
                <ChevronRight size={11} color="rgba(148,163,184,0.35)" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="End session"
                style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(100,116,139,0.18)",
                  background: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                  e.currentTarget.style.background = "rgba(248,113,113,0.07)";
                  e.currentTarget.style.boxShadow = "0 0 8px rgba(248,113,113,0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.borderColor = "rgba(100,116,139,0.18)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            /* ── Guest actions ── */
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "6px 14px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(148,163,184,0.7)",
                  background: "transparent",
                  border: "1px solid rgba(148,163,184,0.14)",
                  borderRadius: 7,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.03em",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#e2e8f0";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.3)";
                  e.currentTarget.style.background = "rgba(148,163,184,0.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "rgba(148,163,184,0.7)";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                sign_in
              </button>

              <button
                onClick={() => navigate("/register")}
                style={{
                  padding: "6px 16px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#020408",
                  background: "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  boxShadow: "0 0 14px rgba(6,182,212,0.4)",
                  transition: "all 0.22s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 0 24px rgba(6,182,212,0.7), 0 0 8px rgba(168,85,247,0.4)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 0 14px rgba(6,182,212,0.4)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                join_now()
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}