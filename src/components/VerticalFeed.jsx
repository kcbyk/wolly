import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Play, Volume2, VolumeX, Download, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { downloadMedia } from "../utils/formatters";

const VerticalVideoCard = memo(function VerticalVideoCard({ post, isActive, isNear, isMuted }) {
  const { users } = useApp();
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressFillRef = useRef(null);
  const progressThumbRef = useRef(null);
  const seekTimeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const wasPlayingRef = useRef(false);

  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId,
    handle: post.userId,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  };

  const videoMedia = post.media?.find((m) => m.type === "video");

  // Play / pause when card active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = isMuted;
      const p = video.play();
      if (p) {
        p.then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  // Sync mute
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // 120fps direct DOM progress update without triggering React re-renders
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isSeeking) return;
    const pct = (video.currentTime / video.duration) * 100;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct}%`;
    }
    if (progressThumbRef.current) {
      progressThumbRef.current.style.left = `calc(${pct}% - 8px)`;
    }
  };

  const seekToX = (clientX) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
    const pct = pos * 100;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct}%`;
    }
    if (progressThumbRef.current) {
      progressThumbRef.current.style.left = `calc(${pct}% - 8px)`;
    }
    if (seekTimeRef.current) {
      const t = pos * video.duration;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      seekTimeRef.current.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
    }
  };

  const onMouseDown = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    wasPlayingRef.current = !video?.paused;
    video?.pause();
    setIsSeeking(true);
    seekToX(e.clientX);
    const onMouseMove = (ev) => seekToX(ev.clientX);
    const onMouseUp = () => {
      setIsSeeking(false);
      if (wasPlayingRef.current) video?.play().then(() => setIsPlaying(true)).catch(() => {});
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { once: true });
  };

  const onTouchStart = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    wasPlayingRef.current = !video?.paused;
    video?.pause();
    setIsSeeking(true);
    seekToX(e.touches[0].clientX);
  };

  const onTouchMove = (e) => {
    e.stopPropagation();
    seekToX(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    e.stopPropagation();
    setIsSeeking(false);
    if (wasPlayingRef.current) videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  if (!videoMedia) return null;

  return (
    <div
      className="relative w-full bg-black overflow-hidden select-none hardware-accelerated"
      style={{
        height: "100dvh",
        flexShrink: 0,
        contain: "strict",
      }}
      onClick={togglePlay}
    >
      {/* Virtualization: Only render active and adjacent video tags, poster image for others */}
      {isNear ? (
        <video
          ref={videoRef}
          src={videoMedia.url}
          poster={videoMedia.poster}
          loop
          muted={isMuted}
          playsInline
          preload={isActive ? "auto" : "metadata"}
          referrerPolicy="no-referrer"
          disableRemotePlayback
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-contain bg-black hardware-accelerated"
        />
      ) : (
        <img
          src={videoMedia.poster || user.avatar}
          alt="poster"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      )}

      {/* Pause indicator */}
      {!isPlaying && !isSeeking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
            <Play className="w-8 h-8 fill-white text-white ml-1 drop-shadow-lg" />
          </div>
        </div>
      )}

      {/* Seek time popup indicator */}
      {isSeeking && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div
            ref={seekTimeRef}
            className="px-5 py-2.5 rounded-2xl bg-black/80 text-white font-mono text-2xl font-bold backdrop-blur-md drop-shadow-2xl border border-white/10"
          >
            0:00
          </div>
        </div>
      )}

      {/* Bottom info + seekbar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20 flex flex-col gap-2 z-20"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 45%, transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 drop-shadow-md"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{user.name}</span>
            <span className="text-[11px] text-slate-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">@{user.handle}</span>
          </div>
        </div>

        {post.content && (
          <p className="text-xs text-white/95 leading-relaxed line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5">
            {post.content}
          </p>
        )}

        {/* Drag-to-seek progress bar with hardware-accelerated direct DOM updates */}
        <div
          ref={progressBarRef}
          className="relative w-full cursor-pointer select-none mt-1.5"
          style={{ padding: "12px 0", touchAction: "none" }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`w-full rounded-full bg-white/20 transition-all duration-150 ${isSeeking ? "h-2" : "h-1"}`}>
            <div
              ref={progressFillRef}
              className="h-full bg-white rounded-full pointer-events-none"
              style={{ width: "0%" }}
            />
          </div>
          <div
            ref={progressThumbRef}
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-xl pointer-events-none transition-opacity duration-150 ${isSeeking ? "opacity-100" : "opacity-0"}`}
            style={{ left: "-8px" }}
          />
        </div>
      </div>
    </div>
  );
});

export default function VerticalFeed({ onBack }) {
  const { posts, showToast } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);

  const videoPosts = posts.filter(
    (p) => p.mediaType === "video" || p.media?.some((m) => m.type === "video")
  );

  const currentPost = videoPosts[activeIndex];
  const currentVideoMedia = currentPost?.media?.find((m) => m.type === "video");

  // 120fps optimized scroll detection using rAF debounce
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const index = Math.round(container.scrollTop / window.innerHeight);
        setActiveIndex((prev) => (prev !== index ? Math.max(0, Math.min(index, videoPosts.length - 1)) : prev));
      }
      isScrollingRef.current = false;
    });
  }, [videoPosts.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleDownloadCurrent = async (e) => {
    e?.stopPropagation?.();
    if (!currentVideoMedia) return;
    showToast("Video indiriliyor...", "info");
    await downloadMedia(currentVideoMedia.url, `video-${Date.now()}.mp4`);
    showToast("Video başarıyla indirildi! 📥");
  };

  if (videoPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 text-sm bg-black">
        Dikey video bulunamadı.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden hardware-accelerated">

      {/* ── Transparent Top Bar (Pure Icons, No Backgrounds) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 14px)",
          paddingBottom: "14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Left: Geri Tuşu */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 p-2 text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] active:scale-90 hover:opacity-80 transition-transform cursor-pointer select-none"
            style={{ pointerEvents: "auto" }}
          >
            <ArrowLeft className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            <span>Akış</span>
          </button>
        )}

        {/* Right: Ses & İndirme Butonları */}
        <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((m) => !m);
            }}
            title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            className="p-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] active:scale-90 hover:opacity-80 transition-transform cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            ) : (
              <Volume2 className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            )}
          </button>

          <button
            onClick={handleDownloadCurrent}
            title="Videoyu İndir"
            className="p-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] active:scale-90 hover:opacity-80 transition-transform cursor-pointer"
          >
            <Download className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
          </button>
        </div>
      </header>

      {/* ── 120fps Fullscreen Scrollable feed ── */}
      <div
        ref={containerRef}
        className="w-full overflow-y-scroll no-scrollbar hardware-accelerated"
        style={{
          height: "100dvh",
          scrollSnapType: "y mandatory",
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "none",
          touchAction: "pan-y",
        }}
      >
        {videoPosts.map((post, idx) => (
          <div
            key={post.id}
            style={{
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
              height: "100dvh",
              contain: "strict",
            }}
          >
            <VerticalVideoCard
              post={post}
              isActive={activeIndex === idx}
              isNear={Math.abs(activeIndex - idx) <= 1}
              isMuted={isMuted}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
