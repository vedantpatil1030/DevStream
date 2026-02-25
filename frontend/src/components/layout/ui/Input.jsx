// src/components/layout/ui/Input.jsx

export default function Input({ label, error, icon: Icon, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.68rem",
          fontWeight: 500,
          color: "rgba(6,182,212,0.7)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <span style={{ color: "rgba(168,85,247,0.6)", marginRight: 4 }}>//</span>
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        {Icon && (
          <div style={{
            position: "absolute",
            left: 12, top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(6,182,212,0.5)",
            pointerEvents: "none",
            zIndex: 1,
            display: "flex", alignItems: "center",
          }}>
            <Icon size={14} />
          </div>
        )}

        <input
          {...props}
          style={{
            width: "100%",
            background: "rgba(5,8,16,0.8)",
            border: `1px solid ${error ? "rgba(248,113,113,0.5)" : "rgba(6,182,212,0.2)"}`,
            borderRadius: 8,
            paddingLeft: Icon ? "2.4rem" : "0.85rem",
            paddingRight: "0.85rem",
            paddingTop: "0.6rem",
            paddingBottom: "0.6rem",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.8rem",
            color: "#e2e8f0",
            outline: "none",
            transition: "all 0.25s",
            boxShadow: error
              ? "0 0 0 1px rgba(248,113,113,0.2)"
              : "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? "rgba(248,113,113,0.7)" : "rgba(6,182,212,0.6)";
            e.target.style.boxShadow = error
              ? "0 0 0 3px rgba(248,113,113,0.1), 0 0 12px rgba(248,113,113,0.15)"
              : "0 0 0 3px rgba(6,182,212,0.1), 0 0 12px rgba(6,182,212,0.15)";
            e.target.style.background = "rgba(6,182,212,0.04)";
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? "rgba(248,113,113,0.5)" : "rgba(6,182,212,0.2)";
            e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.03)";
            e.target.style.background = "rgba(5,8,16,0.8)";
          }}
        />
      </div>

      {error && (
        <p style={{
          fontFamily: "JetBrains Mono",
          fontSize: "0.65rem",
          color: "#f87171",
          letterSpacing: "0.03em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span style={{ color: "#f87171" }}>⚠</span> {error}
        </p>
      )}
    </div>
  );
}