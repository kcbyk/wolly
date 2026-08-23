import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Play, Volume2, VolumeX, Download, ArrowLeft, Loader2, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { downloadMedia } from "../utils/formatters";
import { buildForYouFeed } from "../utils/algorithm";

const VerticalVideoCard = memo(function VerticalVideoCard({ 
  post, 
  isActive, 
  isNext,
  isNear, 
  isMuted
}) {
  const { users, toggleLike, likes } = useApp();
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressFillRef = useRef(null);
  const progressThumbRef = useRef(null);
  const seekTimeRef = useRef(null);
  const targetSeekPosRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const lastTapRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const isLiked = likes.includes(post.id);

  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId,
    handle: post.userId,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${post.userId}`,
  };

  const videoMedia = post.media?.find((m) => m.type === "video");

  // Zero-latency play trigger with abort protection
  const safePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
      setIsBuffering(false);
    } catch (err) {
      if (err.name !== "AbortError") {
        try {
          if (videoRef.current) {
            videoRef.current.muted = true;
            await videoRef.current.play();
            setIsPlaying(true);
            setIsBuffering(false);
          }
        } catch (_) {}
      }
    }
  }, [isMuted]);

  // Handle active status
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      safePlay();
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setIsBuffering(false);
      setIsSeeking(false);
    }
  }, [isActive, safePlay]);

  // Sync mute state immediately
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  // Tap handler: single tap = play/pause, double tap = like
  const handleCardClick = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) toggleLike(post.id, e);
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    const video = videoRef.current;
    if (!video || isSeeking) return;
    if (video.paused) {
      safePlay();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Direct DOM progress update (Zero re-renders during playback)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isSeeking) return;
    
    if (isBuffering) setIsBuffering(false);

    const pct = (video.currentTime / video.duration) * 100;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct}%`;
    }
    if (progressThumbRef.current) {
      progressThumbRef.current.style.left = `calc(${pct}% - 7px)`;
    }
  };

  // Update visual scrub UI
  const updateScrubVisuals = (clientX) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;

    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    targetSeekPosRef.current = pos;

    const pct = pos * 100;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct}%`;
    }
    if (progressThumbRef.current) {
      progressThumbRef.current.style.left = `calc(${pct}% - 7px)`;
    }
    if (seekTimeRef.current) {
      const t = pos * video.duration;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      seekTimeRef.current.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
    }
  };

  const applySeek = () => {
    const video = videoRef.current;
    setIsSeeking(false);
    if (!video || targetSeekPosRef.current === null || !video.duration) return;

    video.currentTime = targetSeekPosRef.current * video.duration;
    targetSeekPosRef.current = null;

    if (wasPlayingRef.current) {
      safePlay();
    }
  };

  const onMouseDown = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    wasPlayingRef.current = !video?.paused;
    video?.pause();
    setIsSeeking(true);
    updateScrubVisuals(e.clientX);

    const onMouseMove = (ev) => updateScrubVisuals(ev.clientX);
    const onMouseUp = () => {
      applySeek();
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
    updateScrubVisuals(e.touches[0].clientX);
  };

  const onTouchMove = (e) => {
    e.stopPropagation();
    updateScrubVisuals(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    e.stopPropagation();
    applySeek();
  };

  if (!videoMedia) return null;

  return (
    <div
      className="relative w-full bg-black overflow-hidden select-none"
      style={{
        height: "100dvh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        contain: "strict",
      }}
      onClick={handleCardClick}
    >
      {/* Background Poster / Thumbnail preview (Instant display while buffer loads) */}
      {videoMedia.poster ? (
        <img
          src={videoMedia.poster}
          alt="poster"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-[#0d0d0d] flex items-center justify-center pointer-events-none">
          <Play className="w-12 h-12 text-white/10" />
        </div>
      )}

      {/* Pre-buffered Video Player */}
      {isNear && (
        <video
          ref={videoRef}
          src={videoMedia.url}
          poster={videoMedia.poster}
          loop
          muted={isMuted}
          playsInline
          autoPlay={isActive}
          preload={isActive || isNext ? "auto" : "metadata"}
          referrerPolicy="no-referrer"
          disableRemotePlayback
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
          onPlaying={() => { setIsPlaying(true); setIsBuffering(false); }}
          onWaiting={() => { if (!isSeeking) setIsBuffering(true); }}
          onCanPlay={() => setIsBuffering(false)}
          onSeeked={() => { setIsBuffering(false); if (wasPlayingRef.current) safePlay(); }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-contain bg-transparent z-10"
        />
      )}

      {/* Double Tap Heart Animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && isActive && !isSeeking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 shadow-2xl">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Center play icon when paused */}
      {!isPlaying && !isSeeking && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center shadow-2xl">
            <Play className="w-7 h-7 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Bottom overlay: User Info, Content, Progress Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-16 flex flex-col gap-2 z-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <img
            src={user.avatar}
            alt={user.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20 shadow-md"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white leading-tight truncate">{user.name}</span>
            <span className="text-[11px] text-slate-300 font-mono truncate">@{user.handle}</span>
          </div>
        </div>

        {post.content && (
          <p className="text-xs text-white/95 leading-relaxed line-clamp-2 mt-0.5">
            {post.content}
          </p>
        )}

        {/* Drag-to-seek progress bar */}
        <div
          ref={progressBarRef}
          className="relative w-full cursor-pointer select-none mt-1"
          style={{ padding: "10px 0", touchAction: "none" }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(e) => {
            e.stopPropagation();
            updateScrubVisuals(e.clientX);
            applySeek();
          }}
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
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-xl pointer-events-none transition-opacity duration-150 ${isSeeking ? "opacity-100" : "opacity-0"}`}
            style={{ left: "-7px" }}
          />
        </div>
      </div>
    </div>
  );
});

export default function VerticalFeed({ onBack }) {
  const { posts, verticalFeedConfig, closeVerticalFeed, showToast } = useApp();
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const targetUserId = verticalFeedConfig?.userId;
  const startPostId = verticalFeedConfig?.startPostId;

  // Filter videos (Stable & Deterministic For You Feed)
  const rawVideoPosts = posts.filter((p) => {
    const isVideo = p.mediaType === "video" || p.media?.some((m) => m.type === "video");
    if (!isVideo) return false;
    if (targetUserId) return p.userId === targetUserId;
    return true;
  });

  const videoPosts = React.useMemo(() => {
    return targetUserId ? rawVideoPosts : buildForYouFeed(rawVideoPosts);
  }, [rawVideoPosts, targetUserId]);

  const [activeIndex, setActiveIndex] = useState(() => {
    if (startPostId && videoPosts.length > 0) {
      const foundIdx = videoPosts.findIndex((p) => p.id === startPostId);
      return foundIdx !== -1 ? foundIdx : 0;
    }
    return 0;
  });

  // Background Stream Preloader: Warm up network cache for next 3 upcoming videos
  useEffect(() => {
    const upcoming = videoPosts.slice(activeIndex + 1, activeIndex + 4);
    upcoming.forEach((p) => {
      const v = p.media?.find((m) => m.type === "video");
      if (v?.url && typeof window !== "undefined") {
        // Pre-warm TCP/TLS connection and fetch first chunk
        fetch(v.url, { headers: { Range: "bytes=0-1048576" } }).catch(() => {});
      }
    });
  }, [activeIndex, videoPosts]);

  // Robust snap scroll tracking (Calculates exact active card from scroll position)
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const itemHeight = window.innerHeight;
        const index = Math.round(container.scrollTop / itemHeight);
        if (index >= 0 && index < videoPosts.length && index !== activeIndex) {
          setActiveIndex(index);
        }
      }
      isScrollingRef.current = false;
    });
  }, [videoPosts.length, activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to starting post on mount
  useEffect(() => {
    if (containerRef.current && activeIndex > 0) {
      containerRef.current.scrollTop = activeIndex * window.innerHeight;
    }
  }, []);

  // Keyboard navigation (ArrowUp, ArrowDown, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, videoPosts.length - 1);
        containerRef.current?.scrollTo({ top: next * window.innerHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        containerRef.current?.scrollTo({ top: prev * window.innerHeight, behavior: "smooth" });
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, videoPosts.length]);

  const currentPost = videoPosts[activeIndex];
  const currentVideoMedia = currentPost?.media?.find((m) => m.type === "video");

  const handleDownloadCurrent = async (e) => {
    e?.stopPropagation?.();
    if (!currentVideoMedia) return;
    showToast("Video indiriliyor...", "info");
    await downloadMedia(currentVideoMedia.url, `video-${Date.now()}.mp4`);
    showToast("Video başarıyla indirildi! 📥");
  };

  const handleBack = () => {
    closeVerticalFeed();
    if (onBack) onBack();
  };

  if (videoPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-slate-400 text-sm bg-black gap-4 p-4 text-center">
        <p>Bu profilde henüz dikey video bulunamadı.</p>
        <button
          onClick={handleBack}
          className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      {/* ── Top Bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 14px)",
          paddingBottom: "14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Left: Geri Tuşu */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 p-2 text-white text-sm font-semibold active:scale-95 transition-transform cursor-pointer select-none bg-black/60 rounded-full px-3.5 border border-white/15 shadow-lg"
          style={{ pointerEvents: "auto" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{targetUserId ? `@${targetUserId}` : "Akış"}</span>
        </button>

        {/* Center: Video Index Counter */}
        <div className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/10 hidden sm:block shadow-md">
          {activeIndex + 1} / {videoPosts.length}
        </div>

        {/* Right: Ses & İndirme Butonları */}
        <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((m) => !m);
            }}
            title={isMuted ? "Sesi Aç (M)" : "Sesi Kapat (M)"}
            className="p-2 text-white bg-black/60 rounded-full border border-white/15 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={handleDownloadCurrent}
            title="Videoyu İndir"
            className="p-2 text-white bg-black/60 rounded-full border border-white/15 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Snappy 120fps Scrollable Container ── */}
      <div
        ref={containerRef}
        className="w-full overflow-y-scroll no-scrollbar"
        style={{
          height: "100dvh",
          scrollSnapType: "y mandatory",
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "none",
          touchAction: "pan-y",
        }}
      >
        {videoPosts.map((post, idx) => (
          <VerticalVideoCard
            key={post.id}
            post={post}
            isActive={activeIndex === idx}
            isNext={idx === activeIndex + 1}
            isNear={Math.abs(activeIndex - idx) <= 1}
            isMuted={isMuted}
          />
        ))}
      </div>

    </div>
  );
}
