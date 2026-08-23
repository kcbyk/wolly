import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Play, Volume2, VolumeX, Download, ArrowLeft, Loader2, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { downloadMedia } from "../utils/formatters";
import { buildForYouFeed } from "../utils/algorithm";
import { videoPreloader } from "../utils/videoPreloader";

/* ─────────────────────────────────────────────
   VerticalVideoCard  — tek kart
───────────────────────────────────────────── */
const VerticalVideoCard = memo(function VerticalVideoCard({
  post,
  isActive,
  isNext,
  isNear,
  isMuted,
}) {
  const { users, toggleLike, likes } = useApp();
  const videoRef          = useRef(null);
  const progressBarRef    = useRef(null);
  const progressFillRef   = useRef(null);
  const progressThumbRef  = useRef(null);
  const targetSeekPosRef  = useRef(null);
  const wasPlayingRef     = useRef(false);
  const lastTapRef        = useRef(0);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isBuffering,  setIsBuffering]  = useState(false);
  const [isSeeking,    setIsSeeking]    = useState(false);
  const [showHeart,    setShowHeart]    = useState(false);

  const isLiked   = likes.includes(post.id);
  const videoMedia = post.media?.find((m) => m.type === "video");

  const user = users.find((u) => u.id === post.userId) || {
    name:   post.userId,
    handle: post.userId,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${post.userId}`,
  };

  /* ── Oynatma motoru ── */
  const safePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = isMuted;
      await v.play();
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

  /* ── Aktif değişimi ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      safePlay();
    } else {
      v.pause();
      v.currentTime = 0;
      setIsPlaying(false);
      setIsBuffering(false);
      setIsSeeking(false);
    }
  }, [isActive, safePlay]);

  /* ── Ses senkrozu ── */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  /* ── Dokunma: tek tık = oynat/durdur, çift tık = beğen ── */
  const handleCardClick = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) toggleLike(post.id, e);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    const v = videoRef.current;
    if (!v || isSeeking) return;
    if (v.paused) safePlay();
    else { v.pause(); setIsPlaying(false); }
  };

  /* ── Progress bar: DOM güncellemesi (re-render yok) ── */
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || isSeeking) return;
    if (isBuffering) setIsBuffering(false);
    const pct = (v.currentTime / v.duration) * 100;
    if (progressFillRef.current)  progressFillRef.current.style.width  = `${pct}%`;
    if (progressThumbRef.current) progressThumbRef.current.style.left   = `calc(${pct}% - 7px)`;
  };

  const setScrubPos = (clientX) => {
    const bar = progressBarRef.current;
    const v   = videoRef.current;
    if (!bar || !v || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const pos  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    targetSeekPosRef.current = pos;
    const pct = pos * 100;
    if (progressFillRef.current)  progressFillRef.current.style.width  = `${pct}%`;
    if (progressThumbRef.current) progressThumbRef.current.style.left   = `calc(${pct}% - 7px)`;
  };

  const applySeek = () => {
    const v = videoRef.current;
    setIsSeeking(false);
    if (!v || targetSeekPosRef.current === null || !v.duration) return;
    v.currentTime = targetSeekPosRef.current * v.duration;
    targetSeekPosRef.current = null;
    if (wasPlayingRef.current) safePlay();
  };

  const onSeekMouseDown = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    wasPlayingRef.current = !v?.paused;
    v?.pause();
    setIsSeeking(true);
    setScrubPos(e.clientX);
    const mm = (ev) => setScrubPos(ev.clientX);
    const mu = () => { applySeek(); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm, { passive: true });
    window.addEventListener("mouseup", mu, { once: true });
  };

  const onSeekTouchStart = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    wasPlayingRef.current = !v?.paused;
    v?.pause();
    setIsSeeking(true);
    setScrubPos(e.touches[0].clientX);
  };

  if (!videoMedia) return null;

  return (
    <div
      className="relative w-full bg-black overflow-hidden select-none"
      style={{ height: "100dvh", scrollSnapAlign: "start", scrollSnapStop: "always", contain: "strict" }}
      onClick={handleCardClick}
    >
      {/* ── Anlık görünen poster (yükleme sırasında siyah ekran yok) ── */}
      <div className="absolute inset-0 w-full h-full bg-[#111] pointer-events-none" />

      {/* ── Video elementi — yakın + aktif kartlara mount ── */}
      {isNear && (
        <video
          ref={videoRef}
          src={videoMedia.url}
          loop
          muted={isMuted}
          playsInline
          autoPlay={isActive}
          /* 
           * preload="auto" → tarayıcı aktif videoya tam buffer uygular.
           * Sıradaki video için fetch ile zaten 3 MB çekildi (videoPreloader).
           * Tarayıcı cache hit yaşayacağı için "auto" sinyali anında çalışır.
           */
          preload={isActive || isNext ? "auto" : "metadata"}
          referrerPolicy="no-referrer"
          disableRemotePlayback
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          onPlay        ={() => { setIsPlaying(true);  setIsBuffering(false); }}
          onPlaying     ={() => { setIsPlaying(true);  setIsBuffering(false); }}
          onWaiting     ={() => { if (!isSeeking) setIsBuffering(true); }}
          onCanPlay     ={() => setIsBuffering(false)}
          onSeeked      ={() => { setIsBuffering(false); if (wasPlayingRef.current) safePlay(); }}
          onPause       ={() => setIsPlaying(false)}
          onTimeUpdate  ={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-contain bg-transparent z-10"
        />
      )}

      {/* ── Çift tık kalp animasyonu ── */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-2xl animate-ping" />
        </div>
      )}

      {/* ── Buffer/yükleme göstergesi ── */}
      {isBuffering && isActive && !isSeeking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 shadow-2xl">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* ── Duraklatılma ikonu ── */}
      {!isPlaying && !isSeeking && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center shadow-2xl">
            <Play className="w-7 h-7 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ── Alt bilgi: profil + altyazı + progress bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-16 flex flex-col gap-2 z-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profil */}
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
          <p className="text-xs text-white/95 leading-relaxed line-clamp-2 mt-0.5">{post.content}</p>
        )}

        {/* Progress / Seek bar */}
        <div
          ref={progressBarRef}
          className="relative w-full cursor-pointer select-none mt-1"
          style={{ padding: "10px 0", touchAction: "none" }}
          onMouseDown={onSeekMouseDown}
          onTouchStart={onSeekTouchStart}
          onTouchMove={(e) => { e.stopPropagation(); setScrubPos(e.touches[0].clientX); }}
          onTouchEnd={(e)  => { e.stopPropagation(); applySeek(); }}
          onClick={(e) => { e.stopPropagation(); setScrubPos(e.clientX); applySeek(); }}
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

/* ─────────────────────────────────────────────
   VerticalFeed  — ana konteyner
───────────────────────────────────────────── */
export default function VerticalFeed({ onBack }) {
  const { posts, verticalFeedConfig, closeVerticalFeed, showToast } = useApp();
  const containerRef    = useRef(null);
  const isScrollingRef  = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const targetUserId = verticalFeedConfig?.userId;
  const startPostId  = verticalFeedConfig?.startPostId;

  /* ── Video listesi (For You algoritması) ── */
  const rawVideoPosts = posts.filter((p) => {
    const isVid = p.mediaType === "video" || p.media?.some((m) => m.type === "video");
    if (!isVid) return false;
    if (targetUserId) return p.userId === targetUserId;
    return true;
  });

  const videoPosts = React.useMemo(
    () => (targetUserId ? rawVideoPosts : buildForYouFeed(rawVideoPosts)),
    [rawVideoPosts, targetUserId]
  );

  const [activeIndex, setActiveIndex] = useState(() => {
    if (startPostId && videoPosts.length > 0) {
      const idx = videoPosts.findIndex((p) => p.id === startPostId);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  /* ── Arka plan önbellek hattı: sonraki 5 videoyu HTTP range-request ile çek ── */
  useEffect(() => {
    const upcoming = videoPosts
      .slice(activeIndex + 1, activeIndex + 6)
      .map((p) => p.media?.find((m) => m.type === "video")?.url)
      .filter(Boolean);

    videoPreloader.enqueue(upcoming);
  }, [activeIndex, videoPosts]);

  /* ── Scroll pozisyonundan aktif kart tespiti (IntersectionObserver yerine) ── */
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    requestAnimationFrame(() => {
      const c = containerRef.current;
      if (c) {
        const idx = Math.round(c.scrollTop / window.innerHeight);
        if (idx >= 0 && idx < videoPosts.length && idx !== activeIndex) {
          setActiveIndex(idx);
        }
      }
      isScrollingRef.current = false;
    });
  }, [videoPosts.length, activeIndex]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener("scroll", handleScroll, { passive: true });
    return () => c.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* ── İlk mount: başlangıç pozisyonuna ın ── */
  useEffect(() => {
    if (containerRef.current && activeIndex > 0) {
      containerRef.current.scrollTop = activeIndex * window.innerHeight;
    }
  }, []);

  /* ── Klavye kontrolü ── */
  useEffect(() => {
    const kd = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, videoPosts.length - 1);
        containerRef.current?.scrollTo({ top: next * window.innerHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        containerRef.current?.scrollTo({ top: prev * window.innerHeight, behavior: "smooth" });
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((p) => !p);
      }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [activeIndex, videoPosts.length]);

  const currentPost      = videoPosts[activeIndex];
  const currentVideoMedia = currentPost?.media?.find((m) => m.type === "video");

  const handleDownload = async (e) => {
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
        <button onClick={handleBack} className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm cursor-pointer">
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
        <button
          onClick={handleBack}
          className="flex items-center gap-2 p-2 text-white text-sm font-semibold active:scale-95 transition-transform cursor-pointer select-none bg-black/60 rounded-full px-3.5 border border-white/15 shadow-lg"
          style={{ pointerEvents: "auto" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{targetUserId ? `@${targetUserId}` : "Akış"}</span>
        </button>

        <div className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/10 hidden sm:block shadow-md">
          {activeIndex + 1} / {videoPosts.length}
        </div>

        <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
            title={isMuted ? "Sesi Aç (M)" : "Sesi Kapat (M)"}
            className="p-2 text-white bg-black/60 rounded-full border border-white/15 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            {isMuted
              ? <VolumeX className="w-5 h-5 text-red-400" />
              : <Volume2 className="w-5 h-5 text-white" />
            }
          </button>

          <button
            onClick={handleDownload}
            title="Videoyu İndir"
            className="p-2 text-white bg-black/60 rounded-full border border-white/15 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Video scroll konteyneri ── */}
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
