// src/components/ui/Button.jsx

export default function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = false,
  ...props
}) {
  const variants = {
    primary: "relative bg-gradient-to-r from-brand-primary to-brand-purple text-white shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:scale-[1.02] before:absolute before:inset-0 before:rounded-lg before:bg-white before:opacity-0 hover:before:opacity-10 before:transition-opacity",
    outline: "bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:border-brand-primary/50 hover:text-slate-100 hover:bg-slate-900/50",
    danger:  "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50",
  };

  return (
    <button
      disabled={loading || props.disabled}
      className={`
        flex items-center justify-center gap-2
        px-4 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-200 disabled:opacity-50
        disabled:cursor-not-allowed cursor-pointer
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}