// src/utils/formatters.js

// 754 → "12:34"
export const formatTimestamp = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

// 3600 → "1h 0m"
export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// 4821 → "4.8K"
export const formatViewers = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n?.toString() || "0";
};

// "2025-02-21" → "Feb 21, 2025"
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
};