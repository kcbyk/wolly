import React, { useEffect, useState } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Heart, 
  ZoomIn, 
  ZoomOut
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { downloadMedia } from "../utils/formatters";

export default function MediaLightbox() {
  const { lightboxData, closeLightbox, toggleLike, likes, showToast, openProfile, users } = useApp();
  const [zoom, setZoom] = useState(1);

  if (!lightboxData) return null;

  const { mediaList = [], activeIndex = 0, post } = lightboxData;
  const [currentIndex, setCurrentIndex] = useState(activeIndex);

  const currentMedia = mediaList[currentIndex] || mediaList[0];
  const isVideo = currentMedia?.type === "video";
  const isLiked = post ? likes.includes(post.id) : false;

  const user = post ? users.find((u) => u.id === post.userId) : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex((i) => i - 1);
      if (e.key === "ArrowRight" && currentIndex < mediaList.length - 1) setCurrentIndex((i) => i + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, mediaList.length, closeLightbox]);

  const handleDownload = async () => {
    if (!currentMedia) return;
    showToast("Medya indiriliyor...", "info");
    await downloadMedia(
      currentMedia.url,
      `sotwe-${isVideo ? "video" : "image"}-${Date.now()}.${isVideo ? "mp4" : "jpg"}`
    );
    showToast("İndirme tamamlandı! 📥");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col justify-between select-none"
      onClick={closeLightbox}
    >
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-b from-black via-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {user ? (
          <div 
            onClick={() => {
              closeLightbox();
              openProfile(user);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/40" />
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-slate-200 transition-colors flex items-center gap-1">
                {user.name}
              </h4>
              <p className="text-xs text-slate-400">@{user.handle}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm font-medium text-slate-400">
            Medya {currentIndex + 1} / {mediaList.length}
          </div>
        )}

        <div className="flex items-center gap-3">
          {post && (
            <button
              onClick={(e) => toggleLike(post.id, e)}
              className={`p-2.5 rounded-full bg-[#212121] hover:bg-pink-500/20 text-white transition-all ${
                isLiked ? "text-pink-500 bg-pink-500/20" : ""
              }`}
              title="Beğen"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-pink-500 text-pink-500" : ""}`} />
            </button>
          )}

          {!isVideo && (
            <div className="hidden sm:flex items-center gap-1 bg-[#212121] rounded-full p-1 border border-white/10">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:text-white text-slate-300 rounded-full transition-colors"
                title="Küçült"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1 text-slate-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 hover:text-white text-slate-300 rounded-full transition-colors"
                title="Büyüt"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#212121] hover:bg-[#2d2d2d] text-white text-xs font-bold transition-colors shadow-lg border border-white/15"
            title="Orijinal Medyayı İndir"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">İndir</span>
          </button>

          <button
            onClick={closeLightbox}
            className="p-2.5 rounded-full bg-[#212121] hover:bg-[#2d2d2d] text-white border border-white/15 transition-colors"
            title="Kapat (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        className="flex-1 relative flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={currentMedia.url}
            controls
            autoPlay
            loop
            playsInline
            preload="metadata"
            referrerPolicy="no-referrer"
            disableRemotePlayback
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
            className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl border border-white/10"
          />
        ) : (
          <div className="relative overflow-auto max-h-[82vh] flex items-center justify-center">
            <img
              src={currentMedia.url}
              alt={currentMedia.alt || "Lightbox View"}
              style={{ transform: `scale(${zoom})`, transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl cursor-grab border border-white/10"
            />
          </div>
        )}

        {mediaList.length > 1 && currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="absolute left-6 p-3 rounded-full bg-[#212121] hover:bg-[#2e2e2e] text-white backdrop-blur-md border border-white/15 transition-all shadow-xl"
            title="Önceki"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {mediaList.length > 1 && currentIndex < mediaList.length - 1 && (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="absolute right-6 p-3 rounded-full bg-[#212121] hover:bg-[#2e2e2e] text-white backdrop-blur-md border border-white/15 transition-all shadow-xl"
            title="Sonraki"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div 
        className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {post ? (
          <p className="text-xs md:text-sm text-slate-300 line-clamp-1 max-w-2xl">
            {post.content}
          </p>
        ) : <div />}

        {mediaList.length > 1 && (
          <div className="flex items-center gap-1.5">
            {mediaList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? "w-6 bg-white" : "w-2 bg-white/20 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
