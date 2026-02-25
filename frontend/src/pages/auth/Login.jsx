// src/pages/auth/Login.jsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Mail, Lock, Terminal } from "lucide-react";
import toast from "react-hot-toast";

import { useLoginMutation, authApi } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import Input from "../../components/layout/ui/Input";
import Button from "../../components/layout/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      // Step 1: Login → backend returns { token }
      const result = await login(data).unwrap();
      const token = result.token;

      // Step 2: Immediately store token
      localStorage.setItem("token", token);

      // Step 3: Fetch user profile with plain fetch (avoids RTK cache timing)
      const meRes = await fetch("/api/auth/getme", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = meRes.ok ? await meRes.json() : {};
      const user = meData?.user ?? null;

      // Step 4: Hydrate Redux
      dispatch(setCredentials({ user, token }));
      toast.success(`Welcome back, ${user?.name ?? "dev"}! 🚀`);
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
      }}
    >
      {/* ambient glow orbs */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "15%", left: "8%",
          width: 340, height: 340,
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
          animation: "float 7s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
          animation: "float 9s ease-in-out infinite reverse",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 10 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          {/* Icon */}
          <div style={{
            width: 60, height: 60,
            background: "linear-gradient(135deg, #06b6d4, #a855f7)",
            borderRadius: 16, margin: "0 auto 1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.15)",
            animation: "float 4s ease-in-out infinite",
          }}>
            <Terminal size={26} color="#fff" />
          </div>

          <h1 style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #e2e8f0 0%, #22d3ee 60%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.5rem",
          }}>
            Welcome back
          </h1>

          <p style={{
            fontFamily: "JetBrains Mono",
            fontSize: "0.7rem",
            color: "rgba(6,182,212,0.6)",
            letterSpacing: "0.08em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{
              display: "inline-block",
              width: 7, height: 7, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 8px #4ade80",
              animation: "flicker 2s infinite",
            }} />
            stream_session.init()
          </p>
        </div>

        {/* ── Terminal Card ── */}
        <div style={{
          background: "rgba(5,8,16,0.82)",
          border: "1px solid rgba(6,182,212,0.2)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 0 0 1px rgba(6,182,212,0.06), 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>
          {/* Terminal title bar */}
          <div style={{
            padding: "10px 16px",
            background: "rgba(2,4,8,0.9)",
            borderBottom: "1px solid rgba(6,182,212,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{
              marginLeft: 12,
              fontFamily: "JetBrains Mono",
              fontSize: "0.65rem",
              color: "rgba(148,163,184,0.4)",
              letterSpacing: "0.06em",
            }}>
              devstream — auth/login.sh
            </span>
          </div>

          <div style={{ padding: "2rem" }}>
            {/* command prompt line */}
            <p style={{
              fontFamily: "JetBrains Mono",
              fontSize: "0.68rem",
              color: "rgba(6,182,212,0.4)",
              marginBottom: "1.5rem",
              letterSpacing: "0.04em",
            }}>
              <span style={{ color: "#4ade80" }}>user@devstream</span>
              <span style={{ color: "#94a3b8" }}>:</span>
              <span style={{ color: "#a855f7" }}>~/auth</span>
              <span style={{ color: "#94a3b8" }}>$ </span>
              <span style={{ color: "#e2e8f0" }}>./login --interactive</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                label="Email"
                type="email"
                placeholder="dev@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                {...register("password")}
              />

              <div style={{ marginTop: "0.5rem" }}>
                <Button type="submit" loading={isLoading} fullWidth>
                  {!isLoading && "$ authenticate --now"}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              margin: "1.5rem 0",
            }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.15))" }} />
              <span style={{
                fontFamily: "JetBrains Mono",
                fontSize: "0.6rem",
                color: "rgba(100,116,139,0.6)",
                letterSpacing: "0.08em",
              }}>/* or */</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, rgba(6,182,212,0.15))" }} />
            </div>

            <p style={{
              textAlign: "center",
              fontFamily: "JetBrains Mono",
              fontSize: "0.72rem",
              color: "rgba(148,163,184,0.6)",
            }}>
              No account?{" "}
              <Link
                to="/register"
                style={{
                  background: "linear-gradient(90deg, #22d3ee, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                register --free →
              </Link>
            </p>
          </div>
        </div>

        {/* floating code comment */}
        <p style={{
          marginTop: "1.25rem",
          textAlign: "center",
          fontFamily: "JetBrains Mono",
          fontSize: "0.6rem",
          color: "rgba(100,116,139,0.35)",
          letterSpacing: "0.05em",
        }}>
          // built with React + WebRTC + love for code
        </p>
      </div>
    </div>
  );
}
