import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Volume2, VolumeX, Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import { downloadMedia } from "../utils/formatters";

function VerticalVideoCard({ post, isActive, isMuted, onToggleMute }) {
  const { users, showToast } = useApp();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId,
    handle: post.userId,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  };

  const videoMedia = post.media?.find((m) => m.type === "video");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = isMuted;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!videoMedia) return;
    showToast("Video indiriliyor...", "info");
    await downloadMedia(videoMedia.url, `video-${Date.now()}.mp4`);
    showToast("Video başarıyla indirildi! 📥");
  };

  if (!videoMedia) return null;

  return (
    <div
      className="relative w-full bg-black overflow-hidden"
      style={{ height: "100dvh", flexShrink: 0 }}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoMedia.url}
        poster={videoMedia.poster}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        referrerPolicy="no-referrer"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-contain bg-black"
      />

      {/* Center play icon when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
            <Play className="w-7 h-7 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div
        className="absolute top-14 right-4 flex flex-col gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onToggleMute}
          className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={handleDownload}
          className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom info — minimal, no gradients */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-16 flex flex-col gap-2 z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 40%, transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/30"
          />
          <span className="text-sm font-bold text-white">@{user.handle}</span>
        </div>

        {post.content && (
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {post.content}
          </p>
        )}

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function VerticalFeed() {
  const { posts } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);

  const videoPosts = posts.filter(
    (p) => p.mediaType === "video" || p.media?.some((m) => m.type === "video")
  );

  // Detect active card via scroll position — no manual touch handlers (scroll-snap handles it)
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cardHeight = window.innerHeight;
    const index = Math.round(container.scrollTop / cardHeight);
    setActiveIndex(Math.max(0, Math.min(index, videoPosts.length - 1)));
  }, [videoPosts.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (videoPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 text-sm bg-black">
        Dikey video bulunamadı.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-y-scroll"
      style={{
        height: "100dvh",
        scrollSnapType: "y mandatory",
        scrollBehavior: "auto",          /* smooth scroll causes double-snap on some devices */
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "none",      /* prevents rubber-band bounce revealing next card */
      }}
    >
      {videoPosts.map((post, idx) => (
        <div
          key={post.id}
          style={{
            scrollSnapAlign: "start",
            scrollSnapStop: "always",    /* force stop at each card, no double-skip */
          }}
        >
          <VerticalVideoCard
            post={post}
            isActive={activeIndex === idx}
            isMuted={isMuted}
            onToggleMute={(e) => {
              e?.stopPropagation?.();
              setIsMuted((m) => !m);
            }}
          />
        </div>
      ))}
    </div>
  );
}
