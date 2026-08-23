import React from "react";

export function formatNumber(num) {
  if (!num && num !== 0) return "0";
  if (typeof num === "string") return num;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function parseTweetText(text, onMentionClick) {
  if (!text) return "";
  
  // Split by mentions (@...)
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const handle = part.slice(1);
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (onMentionClick) onMentionClick(handle);
          }}
          className="text-slate-200 hover:text-white hover:underline cursor-pointer font-semibold transition-colors"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export async function downloadMedia(url, filename = "sotwe-media.jpg") {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    window.open(url, "_blank");
    return true;
  }
}
