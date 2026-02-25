// src/pages/auth/Register.jsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { User, Mail, Lock, Terminal, Tv2, Eye } from "lucide-react";
import toast from "react-hot-toast";

import { useRegisterMutation } from "../../features/auth/authApi";
import { authApi } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import Input from "../../components/layout/ui/Input";
import Button from "../../components/layout/ui/Button";

// ── Zod schema — mirrors backend user.model.js exactly ──────────
const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Min 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  email: z
    .string()
    .email("Valid email required"),
  password: z
    .string()
    .min(6, "Min 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["viewer", "streamer"], {
    required_error: "Please select a role",
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Role option card ─────────────────────────────────────────────
function RoleCard({ value, title, desc, icon: Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 14px",
        borderRadius: 9,
        border: `1px solid ${selected
          ? value === "streamer"
            ? "rgba(239,68,68,0.6)"
            : "rgba(6,182,212,0.6)"
          : "rgba(6,182,212,0.15)"}`,
        background: selected
          ? value === "streamer"
            ? "rgba(239,68,68,0.1)"
            : "rgba(6,182,212,0.1)"
          : "rgba(5,8,16,0.5)",
        cursor: "pointer",
        transition: "all 0.22s",
        textAlign: "left",
        boxShadow: selected
          ? value === "streamer"
            ? "0 0 14px rgba(239,68,68,0.2)"
            : "0 0 14px rgba(6,182,212,0.2)"
          : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon
          size={15}
          color={selected
            ? value === "streamer" ? "#f87171" : "#22d3ee"
            : "rgba(100,116,139,0.6)"}
        />
        <span style={{
          fontFamily: "JetBrains Mono",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: selected
            ? value === "streamer" ? "#f87171" : "#22d3ee"
            : "rgba(148,163,184,0.7)",
          letterSpacing: "0.05em",
        }}>
          {title}
        </span>
        {selected && (
          <span style={{
            marginLeft: "auto",
            width: 7, height: 7, borderRadius: "50%",
            background: value === "streamer" ? "#ef4444" : "#22d3ee",
            boxShadow: `0 0 6px ${value === "streamer" ? "#ef4444" : "#22d3ee"}`,
          }} />
        )}
      </div>
      <p style={{
        fontFamily: "JetBrains Mono",
        fontSize: "0.6rem",
        color: "rgba(100,116,139,0.55)",
        letterSpacing: "0.02em",
        lineHeight: 1.4,
      }}>
        {desc}
      </p>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [selectedRole, setSelectedRole] = useState("");

  const {
    register: formRegister,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue("role", role, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      // Send field as "name" to match backend
      const result = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      }).unwrap();

      const token = result.token;
      localStorage.setItem("token", token);

      // Plain fetch via Vite proxy — avoids CORS and env var issues
      const meRes = await fetch("/api/auth/getme", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = meRes.ok ? await meRes.json() : {};
      const user = meData?.user ?? null;

      dispatch(setCredentials({ user, token }));
      toast.success("Welcome to DevStream! 🎉");
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      position: "relative",
    }}>
      {/* Orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "10%", right: "10%",
          width: 380, height: 380,
          background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
          animation: "float 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "8%", left: "6%",
          width: 300, height: 300,
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
          animation: "float 10s ease-in-out infinite reverse",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: 58, height: 58,
            background: "linear-gradient(135deg, #a855f7, #06b6d4)",
            borderRadius: 16, margin: "0 auto 1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.12)",
            animation: "float 5s ease-in-out infinite",
          }}>
            <Terminal size={24} color="#fff" />
          </div>

          <h1 style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700, fontSize: "1.7rem",
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #e2e8f0 0%, #c084fc 55%, #22d3ee 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.4rem",
          }}>
            Join DevStream
          </h1>

          <p style={{
            fontFamily: "JetBrains Mono", fontSize: "0.68rem",
            color: "rgba(168,85,247,0.55)", letterSpacing: "0.08em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ color: "#f87171" }}>●</span>
            <span style={{ color: "#f59e0b" }}>●</span>
            <span style={{ color: "#22c55e" }}>●</span>
            &nbsp;build_in_public()
          </p>
        </div>

        {/* Terminal Card */}
        <div style={{
          background: "rgba(5,8,16,0.82)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(168,85,247,0.05), 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>
          {/* Title bar */}
          <div style={{
            padding: "10px 16px",
            background: "rgba(2,4,8,0.9)",
            borderBottom: "1px solid rgba(168,85,247,0.1)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {[["#ef4444"], ["#f59e0b"], ["#22c55e"]].map(([c], i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
            ))}
            <span style={{
              marginLeft: 12, fontFamily: "JetBrains Mono",
              fontSize: "0.63rem", color: "rgba(148,163,184,0.35)", letterSpacing: "0.06em",
            }}>
              devstream — auth/register.sh
            </span>
          </div>

          <div style={{ padding: "1.75rem" }}>
            {/* prompt */}
            <p style={{
              fontFamily: "JetBrains Mono", fontSize: "0.67rem",
              color: "rgba(168,85,247,0.45)", marginBottom: "1.4rem",
            }}>
              <span style={{ color: "#4ade80" }}>user@devstream</span>
              <span style={{ color: "#475569" }}>:</span>
              <span style={{ color: "#a855f7" }}>~/auth</span>
              <span style={{ color: "#475569" }}>$ </span>
              <span style={{ color: "#e2e8f0" }}>./register --new-user</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

              {/* Username — maps to backend "name" field */}
              <Input
                label="Username"
                placeholder="cool_dev_42"
                icon={User}
                error={errors.name?.message}
                {...formRegister("name")}
              />

              <Input
                label="Email"
                type="email"
                placeholder="dev@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...formRegister("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="min 6 characters"
                icon={Lock}
                error={errors.password?.message}
                {...formRegister("password")}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...formRegister("confirmPassword")}
              />

              {/* ── Role selector ─────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{
                  fontFamily: "JetBrains Mono", fontSize: "0.68rem",
                  fontWeight: 500, color: "rgba(6,182,212,0.7)",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  <span style={{ color: "rgba(168,85,247,0.6)", marginRight: 4 }}>//</span>
                  Select Role
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <RoleCard
                    value="viewer"
                    title="viewer"
                    desc="Watch live coding streams, join chats, follow streamers"
                    icon={Eye}
                    selected={selectedRole === "viewer"}
                    onClick={() => handleRoleSelect("viewer")}
                  />
                  <RoleCard
                    value="streamer"
                    title="streamer"
                    desc="Go live, broadcast your coding sessions to the world"
                    icon={Tv2}
                    selected={selectedRole === "streamer"}
                    onClick={() => handleRoleSelect("streamer")}
                  />
                </div>

                {/* hidden input for react-hook-form */}
                <input type="hidden" {...formRegister("role")} />

                {errors.role && (
                  <p style={{
                    fontFamily: "JetBrains Mono", fontSize: "0.65rem",
                    color: "#f87171", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span>⚠</span> {errors.role.message}
                  </p>
                )}
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <Button type="submit" loading={isLoading} fullWidth>
                  {!isLoading && "$ create_account()"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.4rem 0" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.15))" }} />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6rem", color: "rgba(100,116,139,0.55)" }}>/* or */</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, rgba(168,85,247,0.15))" }} />
            </div>

            <p style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: "0.7rem", color: "rgba(148,163,184,0.55)" }}>
              Have an account?{" "}
              <Link
                to="/login"
                style={{
                  background: "linear-gradient(90deg, #c084fc, #22d3ee)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text", fontWeight: 700, textDecoration: "none",
                }}
              >
                sign_in() →
              </Link>
            </p>
          </div>
        </div>

        <p style={{
          marginTop: "1.25rem", textAlign: "center",
          fontFamily: "JetBrains Mono", fontSize: "0.58rem",
          color: "rgba(100,116,139,0.3)",
        }}>
          // free forever · no credit card · open source
        </p>
      </div>
    </div>
  );
}