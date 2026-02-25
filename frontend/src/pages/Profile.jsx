// src/pages/Profile.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Github, Linkedin, Mail, Calendar,
  Tv2, Eye, Edit2, X, Check,
  Users, Radio, Link2, Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

import { useGetProfileQuery, useFollowUserMutation, useUpdateProfileMutation } from "../features/user/userApi";
import { selectCurrentUser } from "../features/auth/authSlice";
import { updateUser } from "../features/auth/authSlice";

/* ── Inline spinner ────────────────────────────────────────── */
function Spin() {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: "50%",
      border: "2px solid rgba(6,182,212,0.25)",
      borderTopColor: "#22d3ee",
      display: "inline-block",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

/* ── Stat pill ──────────────────────────────────────────────── */
function Stat({ label, value, icon: Icon }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "14px 24px",
      background: "rgba(6,182,212,0.04)",
      border: "1px solid rgba(6,182,212,0.1)",
      borderRadius: 10,
      minWidth: 90,
    }}>
      {Icon && <Icon size={14} color="rgba(6,182,212,0.5)" />}
      <span style={{ fontFamily: "JetBrains Mono", fontSize: "1.3rem", fontWeight: 700, color: "#22d3ee" }}>
        {value ?? 0}
      </span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(148,163,184,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────────── */
function Section({ title, accent = "#06b6d4", children }) {
  return (
    <div style={{
      background: "rgba(5,8,16,0.6)",
      border: "1px solid rgba(6,182,212,0.1)",
      borderRadius: 12,
      padding: "1.25rem 1.5rem",
      marginBottom: "1rem",
    }}>
      <p style={{
        fontFamily: "JetBrains Mono", fontSize: "0.62rem",
        fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "rgba(148,163,184,0.4)", marginBottom: "1rem",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 6px ${accent}`, display: "inline-block" }} />
        {title}
      </p>
      
      {children}
    </div>
  );
}

/* ── Terminal-styled input ──────────────────────────────────── */
function TermInput({ label, value, onChange, name, placeholder, type = "text", maxLength, rows }) {
  const baseStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(2,4,10,0.8)",
    border: "1px solid rgba(6,182,212,0.2)",
    borderRadius: 8, padding: "8px 12px",
    fontFamily: "JetBrains Mono", fontSize: "0.78rem",
    color: "#e2e8f0",
    outline: "none", resize: "vertical",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{
        fontFamily: "JetBrains Mono", fontSize: "0.62rem",
        color: "rgba(6,182,212,0.55)", letterSpacing: "0.08em",
        display: "block", marginBottom: 4,
      }}>
        <span style={{ color: "rgba(168,85,247,0.5)" }}>// </span>{label}
      </label>
      {rows ? (
        <textarea
          name={name} value={value} onChange={onChange}
          placeholder={placeholder} maxLength={maxLength} rows={rows}
          style={baseStyle}
          onFocus={e => e.target.style.borderColor = "rgba(6,182,212,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(6,182,212,0.2)"}
        />
      ) : (
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} maxLength={maxLength}
          style={{ ...baseStyle, resize: undefined }}
          onFocus={e => e.target.style.borderColor = "rgba(6,182,212,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(6,182,212,0.2)"}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const { data, isLoading, isError, refetch } = useGetProfileQuery(username, {
    skip: !username,
  });
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const profile = data?.user;
  const isOwnProfile = currentUser?.name?.toLowerCase() === username?.toLowerCase();

  const [editMode, setEditMode] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [formData, setFormData] = useState({ bio: "", avatar: "", socialLinks: { github: "", linkedin: "" } });

  // Seed form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio ?? "",
        avatar: profile.avatar ?? "",
        socialLinks: {
          github: profile.socialLinks?.github ?? "",
          linkedin: profile.socialLinks?.linkedin ?? "",
        },
      });
      setFollowed(false); // reset on profile switch
    }
  }, [profile]);

  // Redirect /u/undefined
  useEffect(() => {
    if (username === "undefined" || !username) {
      toast.error("Invalid profile link");
      navigate("/", { replace: true });
    }
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("social_")) {
      const key = name.replace("social_", "");
      setFormData(p => ({ ...p, socialLinks: { ...p.socialLinks, [key]: value } }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (formData.bio !== profile?.bio) updates.bio = formData.bio;
      if (formData.avatar !== profile?.avatar) updates.avatar = formData.avatar;
      const ghChanged = formData.socialLinks.github !== (profile?.socialLinks?.github ?? "");
      const liChanged = formData.socialLinks.linkedin !== (profile?.socialLinks?.linkedin ?? "");
      if (ghChanged || liChanged) updates.socialLinks = formData.socialLinks;

      if (!Object.keys(updates).length) { setEditMode(false); return; }

      const result = await updateProfile(updates).unwrap();
      dispatch(updateUser(result.user));
      refetch();
      setEditMode(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update");
    }
  };

  const handleFollow = async () => {
    if (!currentUser) { toast.error("Login to follow"); return; }
    try {
      const res = await followUser(profile.id).unwrap();
      setFollowed(f => !f);
      toast.success(res.message);
    } catch {
      toast.error("Failed to follow");
    }
  };

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Spin />
        <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(6,182,212,0.5)", marginTop: 16 }}>
          fetching profile...
        </p>
      </div>
    </div>
  );

  /* ── Error ───────────────────────────────────────────────── */
  if (isError || !profile) return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Terminal size={32} color="rgba(168,85,247,0.4)" />
      <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "rgba(148,163,184,0.5)" }}>
        user not found — <span style={{ color: "#a855f7" }}>{username}</span>
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "8px 20px", borderRadius: 8,
          background: "linear-gradient(135deg,#06b6d4,#a855f7)",
          border: "none", color: "#fff",
          fontFamily: "JetBrains Mono", fontSize: "0.72rem", fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ← back to home
      </button>
    </div>
  );

  const roleColor = profile.role === "streamer" ? "#f87171" : "#22d3ee";
  const avatarChar = profile.name?.[0]?.toUpperCase() ?? "?";

  /* ── Page ────────────────────────────────────────────────── */
  return (
    <div style={{
      maxWidth: 820,
      margin: "0 auto",
      padding: "2rem 1.25rem 4rem",
      position: "relative",
      zIndex: 5,
    }}>
      {/* Terminal breadcrumb */}
      <p style={{
        fontFamily: "JetBrains Mono", fontSize: "0.65rem",
        color: "rgba(100,116,139,0.5)", marginBottom: "1.5rem",
      }}>
        <span style={{ color: "#4ade80" }}>~/users</span>
        <span style={{ color: "#475569" }}> / </span>
        <span style={{ color: "#22d3ee" }}>{profile.name}</span>
      </p>

      {/* ═══ HERO CARD ══════════════════════════════════════ */}
      <div style={{
        background: "rgba(5,8,16,0.82)",
        border: "1px solid rgba(6,182,212,0.18)",
        borderRadius: 16,
        padding: "2rem",
        marginBottom: "1rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Top strip */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${roleColor} 40%, #a855f7 70%, transparent)`,
          opacity: 0.6,
        }} />

        {/* Role badge */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          background: profile.role === "streamer" ? "rgba(239,68,68,0.1)" : "rgba(6,182,212,0.1)",
          border: `1px solid ${roleColor}44`,
        }}>
          {profile.role === "streamer"
            ? <Radio size={11} color="#f87171" />
            : <Eye size={11} color="#22d3ee" />}
          <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.62rem", fontWeight: 700, color: roleColor, letterSpacing: "0.08em" }}>
            {profile.role}
          </span>
        </div>

        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.25))",
              border: `3px solid ${roleColor}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.4rem", fontWeight: 800, color: roleColor,
              fontFamily: "JetBrains Mono",
              boxShadow: `0 0 24px ${roleColor}30`,
            }}>
              {profile.avatar && !profile.avatar.includes("gravatar") ? (
                <img src={profile.avatar} alt={profile.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <span>{avatarChar}</span>
              )}
            </div>
            {/* Online dot */}
            <span style={{
              position: "absolute", bottom: 4, right: 4,
              width: 12, height: 12, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 8px #4ade80",
              border: "2px solid rgba(5,8,16,0.9)",
            }} />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: "1.7rem",
              color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0,
            }}>
              {profile.name}
            </h1>

            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Mail size={12} color="rgba(100,116,139,0.5)" />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(100,116,139,0.55)" }}>
                {profile.email}
              </span>
            </div>

            {/* Joined */}
            {profile.createdAt && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Calendar size={12} color="rgba(100,116,139,0.5)" />
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "rgba(100,116,139,0.5)" }}>
                  joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <Stat label="Followers" value={profile.followersCount} icon={Users} />
              <Stat label="Following" value={profile.followingCount} icon={Link2} />
              {profile.role === "streamer" && <Stat label="Streams" value={0} icon={Tv2} />}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "1.5rem", flexWrap: "wrap" }}>
          {isOwnProfile ? (
            editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 18px", borderRadius: 8,
                    background: "linear-gradient(135deg,#06b6d4,#a855f7)",
                    border: "none", color: "#fff",
                    fontFamily: "JetBrains Mono", fontSize: "0.72rem", fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.7 : 1,
                    boxShadow: "0 0 14px rgba(6,182,212,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {isSaving ? <Spin /> : <Check size={13} />}
                  {isSaving ? "saving..." : "$ save_changes()"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", borderRadius: 8,
                    background: "transparent",
                    border: "1px solid rgba(100,116,139,0.2)",
                    color: "rgba(148,163,184,0.7)",
                    fontFamily: "JetBrains Mono", fontSize: "0.72rem",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(148,163,184,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(100,116,139,0.2)"}
                >
                  <X size={13} /> cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8,
                  background: "rgba(6,182,212,0.08)",
                  border: "1px solid rgba(6,182,212,0.25)",
                  color: "#22d3ee",
                  fontFamily: "JetBrains Mono", fontSize: "0.72rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(6,182,212,0.14)";
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(6,182,212,0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(6,182,212,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Edit2 size={13} /> edit_profile()
              </button>
            )
          ) : currentUser && (
            <button
              onClick={handleFollow}
              disabled={isFollowing}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 8,
                background: followed ? "transparent" : "linear-gradient(135deg,#06b6d4,#a855f7)",
                border: followed ? "1px solid rgba(6,182,212,0.3)" : "none",
                color: followed ? "#22d3ee" : "#fff",
                fontFamily: "JetBrains Mono", fontSize: "0.72rem", fontWeight: 700,
                cursor: isFollowing ? "not-allowed" : "pointer",
                boxShadow: followed ? "none" : "0 0 14px rgba(6,182,212,0.3)",
                transition: "all 0.22s",
              }}
            >
              <Users size={13} />
              {followed ? "following ✓" : "follow()"}
            </button>
          )}
        </div>
      </div>

      {/* ═══ EDIT FORM ══════════════════════════════════════ */}
      {editMode && isOwnProfile && (
        <Section title="Edit Profile" accent="#a855f7">
          <form onSubmit={handleSave}>
            <TermInput
              label="Avatar URL"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
            <TermInput
              label={`Bio (${formData.bio.length}/160)`}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell the world what you code..."
              maxLength={160}
              rows={3}
            />
            <TermInput
              label="GitHub URL"
              name="social_github"
              value={formData.socialLinks.github}
              onChange={handleChange}
              placeholder="https://github.com/your-handle"
              type="url"
            />
            <TermInput
              label="LinkedIn URL"
              name="social_linkedin"
              value={formData.socialLinks.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/your-handle"
              type="url"
            />
          </form>
        </Section>
      )}

      {/* ═══ BIO ════════════════════════════════════════════ */}
      <Section title="About">
        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: "0.88rem",
          color: profile.bio ? "rgba(203,213,225,0.8)" : "rgba(100,116,139,0.45)",
          lineHeight: 1.65,
          fontStyle: profile.bio ? "normal" : "italic",
        }}>
          {profile.bio || (isOwnProfile ? "// no bio yet — click edit_profile() to add one" : "// no bio provided")}
        </p>
      </Section>

      {/* ═══ SOCIAL LINKS ═══════════════════════════════════ */}
      {(profile.socialLinks?.github || profile.socialLinks?.linkedin || isOwnProfile) && (
        <Section title="Social Links">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {profile.socialLinks?.github ? (
              <a
                href={profile.socialLinks.github}
                target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 8,
                  background: "rgba(6,182,212,0.06)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#22d3ee",
                  fontFamily: "JetBrains Mono", fontSize: "0.72rem",
                  textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.12)"; e.currentTarget.style.boxShadow = "0 0 8px rgba(6,182,212,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Github size={14} /> GitHub
              </a>
            ) : isOwnProfile && (
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "rgba(100,116,139,0.4)", fontStyle: "italic" }}>
                // no github linked
              </span>
            )}

            {profile.socialLinks?.linkedin ? (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 8,
                  background: "rgba(168,85,247,0.06)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  color: "#c084fc",
                  fontFamily: "JetBrains Mono", fontSize: "0.72rem",
                  textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.06)"; }}
              >
                <Linkedin size={14} /> LinkedIn
              </a>
            ) : isOwnProfile && profile.socialLinks?.github && (
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.65rem", color: "rgba(100,116,139,0.4)", fontStyle: "italic" }}>
                // no linkedin linked
              </span>
            )}
          </div>
        </Section>
      )}

      {/* ═══ ACCOUNT INFO ════════════════════════════════════ */}
      <Section title="Account Info">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Username", value: profile.name },
            { label: "Email", value: profile.email },
            {
              label: "Role", value: profile.role,
              chip: true, color: profile.role === "streamer" ? "#f87171" : "#22d3ee"
            },
            {
              label: "Member Since",
              value: new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            },
          ].map(({ label, value, chip, color }) => (
            <div key={label}>
              <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(100,116,139,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                {label}
              </p>
              {chip ? (
                <span style={{
                  fontFamily: "JetBrains Mono", fontSize: "0.72rem", fontWeight: 700,
                  color, background: `${color}18`, border: `1px solid ${color}44`,
                  padding: "2px 10px", borderRadius: 20,
                }}>
                  {value}
                </span>
              ) : (
                <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.78rem", color: "rgba(203,213,225,0.75)" }}>
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}