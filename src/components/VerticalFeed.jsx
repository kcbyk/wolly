import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Volume2, VolumeX, Download, ChevronUp, ChevronDown } from "lucide-react";
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

  // Auto-play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise) {
        playPromise.then(() => setIsPlaying(true)).catch(() => {
          // Autoplay blocked — try muted
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Sync mute from parent
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

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Center play indicator (only shows briefly when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
            <Play className="w-7 h-7 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div
        className="absolute top-14 right-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom: user info + caption + progress */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20 flex flex-col gap-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* User */}
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-bold text-white drop-shadow">@{user.handle}</span>
        </div>

        {/* Caption */}
        {post.content && (
          <p className="text-xs text-slate-200 leading-relaxed line-clamp-2 drop-shadow">
            {post.content}
          </p>
        )}

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-white/25 rounded-full overflow-hidden mt-1">
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
  const [isMuted, setIsMuted] = useState(false); // start unmuted
  const containerRef = useRef(null);
  const isScrolling = useRef(false);

  const videoPosts = posts.filter(
    (p) => p.mediaType === "video" || p.media?.some((m) => m.type === "video")
  );

  // Scroll to specific index
  const scrollToIndex = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;
    const target = Math.max(0, Math.min(index, videoPosts.length - 1));
    container.scrollTo({ top: target * window.innerHeight, behavior: "smooth" });
    setActiveIndex(target);
  }, [videoPosts.length]);

  // Detect which card is visible via scroll position
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / window.innerHeight);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Touch swipe detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 40) {
        if (delta > 0) {
          // Swipe up → next
          scrollToIndex(activeIndex + 1);
        } else {
          // Swipe down → prev
          scrollToIndex(activeIndex - 1);
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex, scrollToIndex]);

  if (videoPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 text-sm bg-black">
        Dikey video bulunamadı.
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black" style={{ height: "100dvh" }}>
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="w-full overflow-y-scroll"
        style={{
          height: "100dvh",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {videoPosts.map((post, idx) => (
          <div
            key={post.id}
            style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
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

      {/* Nav arrows (desktop) */}
      <div className="hidden md:flex absolute right-6 bottom-24 flex-col gap-2 z-20">
        <button
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === videoPosts.length - 1}
          className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Video counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/50 border border-white/15 text-xs text-white font-medium backdrop-blur-md">
        {activeIndex + 1} / {videoPosts.length}
      </div>
    </div>
  );
}
