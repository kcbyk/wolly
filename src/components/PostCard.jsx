import React, { useState } from "react";
import { 
  CheckCircle, 
  MoreHorizontal,
  ExternalLink,
  Share2,
  Download
} from "lucide-react";
import { parseTweetText, downloadMedia } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import VideoPlayer from "./VideoPlayer";

export default function PostCard({ post }) {
  const { 
    users, 
    openLightbox, 
    openProfile, 
    showToast
  } = useApp();

  const [showMenu, setShowMenu] = useState(false);

  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId,
    handle: post.userId,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    verified: false
  };


  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + "/#" + post.id);
    showToast("Gönderi bağlantısı kopyalandı! 🔗");
  };

  const handleDownloadAll = async (e) => {
    e.stopPropagation();
    if (!post.media || post.media.length === 0) return;
    showToast("Medya indiriliyor...", "info");
    const firstMedia = post.media[0];
    await downloadMedia(firstMedia.url, `sotwe-${post.id}-${Date.now()}.${firstMedia.type === "video" ? "mp4" : "jpg"}`);
    showToast("Medya başarıyla indirildi! 📥");
  };

  return (
    <article className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-3 relative group">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div 
          onClick={() => openProfile(user)}
          className="flex items-center gap-3 cursor-pointer group/user flex-1 min-w-0"
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10 group-hover/user:ring-white/40 transition-all shadow-md"
            />
            {user.badgeType === "gold" && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-black">
                ✓
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm md:text-base text-slate-100 group-hover/user:text-white transition-colors truncate">
                {user.name}
              </span>
              {user.verified && (
                <CheckCircle className="w-4 h-4 shrink-0 text-slate-300 fill-white/10" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">@{user.handle}</span>
              <span>·</span>
              <span className="shrink-0">{post.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-[#141414] border border-white/15 shadow-2xl py-2 z-20 text-xs text-slate-300 backdrop-blur-2xl"
              onClick={() => setShowMenu(false)}
            >
              <button
                onClick={() => openProfile(user)}
                className="w-full px-4 py-2.5 text-left hover:bg-white/10 hover:text-white flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Profili Görüntüle
              </button>
              <button
                onClick={handleShare}
                className="w-full px-4 py-2.5 text-left hover:bg-white/10 hover:text-white flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" /> Bağlantıyı Kopyala
              </button>
              {post.media?.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="w-full px-4 py-2.5 text-left hover:bg-white/10 hover:text-white flex items-center gap-2 text-slate-200 font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Medyayı İndir
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tweet Body Text */}
      <p className="text-sm md:text-[15px] leading-relaxed text-slate-200 break-words whitespace-pre-line">
        {parseTweetText(post.content, (handle) => openProfile(handle))}
      </p>

      {/* Media Grid / Video */}
      {post.media && post.media.length > 0 && (
        <div className="mt-1">
          {post.mediaType === "video" || post.media[0].type === "video" ? (
            <VideoPlayer
              url={post.media[0].url}
              poster={post.media[0].poster}
              post={post}
              onExpand={() => openLightbox(post.media, 0, post)}
            />
          ) : post.media.length === 1 ? (
            <div 
              onClick={() => openLightbox(post.media, 0, post)}
              className="relative rounded-2xl overflow-hidden group/img cursor-pointer bg-black aspect-video md:aspect-[16/10] border border-white/10"
            >
              <img
                src={post.media[0].url}
                alt={post.media[0].alt || "Sotwe Post Media"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-xs text-white/90 font-medium">Büyütmek için tıkla</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMedia(post.media[0].url, `sotwe-img-${Date.now()}.jpg`);
                    showToast("Görsel indirildi! 🖼️");
                  }}
                  title="Görseli İndir"
                  className="p-2.5 rounded-full bg-[#212121] hover:bg-[#2c2c2c] text-white border border-white/15 backdrop-blur-md transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-1.5 rounded-2xl overflow-hidden ${post.media.length === 2 ? "grid-cols-2 aspect-video" : "grid-cols-2 aspect-square"}`}>
              {post.media.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(post.media, index, post)}
                  className={`relative overflow-hidden cursor-pointer group/img bg-black border border-white/5 ${post.media.length === 3 && index === 0 ? "row-span-2" : ""}`}
                >
                  <img
                    src={item.url}
                    alt={item.alt || `Media ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  
                  {index === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-[#212121]/90 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/10">
                      +{post.media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}



    </article>
  );
}
