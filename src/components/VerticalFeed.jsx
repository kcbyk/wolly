import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Volume2, VolumeX, Heart, 
  MessageCircle, Bookmark, Share2, CheckCircle, Download
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatNumber, downloadMedia } from "../utils/formatters";

function VerticalVideoCard({ post, isActive }) {
  const { users, likes, bookmarks, toggleLike, toggleBookmark, setCommentsModalPost, openProfile, showToast } = useApp();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId, handle: post.userId,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  };

  const isLiked = likes.includes(post.id);
  const isBookmarked = bookmarks.includes(post.id);
  const videoMedia = post.media?.find((m) => m.type === "video");

  // Auto-play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
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
    await downloadMedia(videoMedia.url, `sotwe-vertical-${Date.now()}.mp4`);
    showToast("Video başarıyla indirildi! 📥");
  };

  if (!videoMedia) return null;

  return (
    <div className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-[#141414] border border-white/10 shadow-2xl" style={{ aspectRatio: "9/16" }}>
      
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
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />

      {/* Center play/pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-[#212121]/90 border border-white/20 flex items-center justify-center shadow-2xl">
            <Play className="w-7 h-7 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-[#212121]/90 border border-white/15 text-white backdrop-blur-md shadow-lg hover:bg-[#2d2d2d] transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={handleDownload}
          className="p-2.5 rounded-full bg-[#212121]/90 border border-white/15 text-white backdrop-blur-md shadow-lg hover:bg-[#2d2d2d] transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom info + actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
        
        {/* Left: User info & text */}
        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          {/* User */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => openProfile(user)}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#212121] group-hover:ring-white/40 transition-all shadow-lg"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white leading-none">{user.name}</span>
                {user.verified && <CheckCircle className="w-3.5 h-3.5 text-slate-300 fill-white/10" />}
              </div>
              <span className="text-[11px] text-slate-400">@{user.handle}</span>
            </div>
          </div>

          {/* Caption */}
          <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
            {post.content}
          </p>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-col items-center gap-4 pb-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(post.id, e); }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`p-2.5 rounded-full border border-white/15 backdrop-blur-md shadow-lg transition-all ${isLiked ? "bg-pink-500/20 border-pink-500/40" : "bg-[#212121]/90 hover:bg-[#2d2d2d]"}`}>
              <Heart className={`w-5 h-5 ${isLiked ? "fill-pink-500 text-pink-500" : "text-white"}`} />
            </div>
            <span className="text-[11px] text-white font-medium">{formatNumber(post.stats?.likes || 0)}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setCommentsModalPost(post); }}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-2.5 rounded-full bg-[#212121]/90 border border-white/15 text-white backdrop-blur-md shadow-lg hover:bg-[#2d2d2d] transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-white font-medium">{formatNumber(post.stats?.replies || 0)}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`p-2.5 rounded-full border border-white/15 backdrop-blur-md shadow-lg transition-all ${isBookmarked ? "bg-white/20 border-white/40" : "bg-[#212121]/90 hover:bg-[#2d2d2d]"}`}>
              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-white text-white" : "text-white"}`} />
            </div>
            <span className="text-[11px] text-white font-medium">{formatNumber(post.stats?.bookmarks || 0)}</span>
          </button>

          <button
            onClick={(e) => { 
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.origin + "/#" + post.id);
              showToast("Bağlantı kopyalandı! 🔗");
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-2.5 rounded-full bg-[#212121]/90 border border-white/15 text-white backdrop-blur-md shadow-lg hover:bg-[#2d2d2d] transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-white font-medium">Paylaş</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function VerticalFeed() {
  const { posts } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  // Filter posts that have video media
  const videoPosts = posts.filter((p) => 
    p.mediaType === "video" || p.media?.some((m) => m.type === "video")
  );

  // IntersectionObserver to detect which card is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const index = parseInt(entry.target.dataset.index, 10);
            setActiveIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videoPosts.length]);

  if (videoPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 text-sm">
        Dikey video bulunamadı.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 items-center w-full py-2 max-w-sm mx-auto no-scrollbar"
      style={{ scrollSnapType: "y mandatory", overflowY: "auto", maxHeight: "96vh" }}
    >
      {videoPosts.map((post, idx) => (
        <div
          key={post.id}
          ref={(el) => (cardRefs.current[idx] = el)}
          data-index={idx}
          style={{ scrollSnapAlign: "start", width: "100%" }}
        >
          <VerticalVideoCard post={post} isActive={activeIndex === idx} />
        </div>
      ))}
    </div>
  );
}
