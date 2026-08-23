import React, { useState, memo } from "react";
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Share2,
  Play,
  Film
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatNumber } from "../utils/formatters";
import PostCard from "./PostCard";

export default function UserProfileModal() {
  const { 
    selectedUser, 
    closeProfile, 
    posts, 
    following, 
    toggleFollow, 
    openLightbox,
    openVerticalFeed, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState("media"); // Default to media for fast browsing

  if (!selectedUser) return null;

  const isFollowed = following.includes(selectedUser.id);
  const userPosts = posts.filter((p) => p.userId === selectedUser.id);

  const userMediaItems = userPosts.flatMap((p) => 
    (p.media || []).map((m) => ({ ...m, parentPost: p }))
  );

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.origin + "/@" + selectedUser.handle);
    showToast("Profil bağlantısı kopyalandı! 🔗");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={closeProfile}
    >
      <div 
        className="glass-modal w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-auto text-slate-100 max-h-[90vh] flex flex-col border border-white/10 bg-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar">
          
          {/* Banner */}
          <div className="relative h-32 sm:h-44 w-full bg-[#0d0d0d]">
            {selectedUser.banner ? (
              <img
                src={selectedUser.banner}
                alt="Banner"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#181818] to-[#0a0a0a]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/50" />
            
            <button
              onClick={closeProfile}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 hover:bg-[#212121] text-white transition-colors border border-white/15 shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile info */}
          <div className="px-6 pb-4 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-14 mb-3">
              <div className="relative">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-[#141414] shadow-xl bg-black"
                />
                {selectedUser.badgeType === "gold" && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-black">
                    ✓
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-full bg-[#1c1c1c] border border-white/10 hover:bg-[#262626] text-slate-300 transition-colors cursor-pointer"
                  title="Profili Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleFollow(selectedUser.id)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${
                    isFollowed
                      ? "border border-white/15 text-slate-300 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                      : "bg-white text-slate-950 hover:bg-slate-200 shadow-md"
                  }`}
                >
                  {isFollowed ? "Takip Ediliyor" : "Takip Et"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {selectedUser.name}
              </h2>
              {selectedUser.verified && (
                <CheckCircle className="w-5 h-5 text-slate-300 fill-white/10" />
              )}
            </div>
            <p className="text-sm text-slate-400 mb-2 font-mono">@{selectedUser.handle}</p>

            <p className="text-sm text-slate-200 leading-relaxed mb-3">
              {selectedUser.bio}
            </p>

            <div className="flex items-center gap-6 text-sm border-t border-white/10 pt-3">
              <div>
                <span className="font-bold text-white mr-1">{formatNumber(selectedUser.following)}</span>
                <span className="text-slate-400 text-xs">Takip Edilen</span>
              </div>
              <div>
                <span className="font-bold text-white mr-1">{formatNumber(selectedUser.followers)}</span>
                <span className="text-slate-400 text-xs">Takipçi</span>
              </div>
              <div>
                <span className="font-bold text-white mr-1">{formatNumber(selectedUser.postsCount || userPosts.length)}</span>
                <span className="text-slate-400 text-xs">Video / Gönderi</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#141414] sticky top-0 z-10">
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative cursor-pointer ${
                activeTab === "media" ? "text-white bg-[#1c1c1c]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Videolar ({userMediaItems.length})
              {activeTab === "media" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("tweets")}
              className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative cursor-pointer ${
                activeTab === "tweets" ? "text-white bg-[#1c1c1c]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gönderi Akışı ({userPosts.length})
              {activeTab === "tweets" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "media" && (
              <div className="flex flex-col gap-3">
                {userMediaItems.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-slate-400">
                        {userMediaItems.length} video mevcut • Tıklayıp dikey formatta izleyin
                      </span>
                    </div>

                    {/* 120fps Pure CSS Thumbnail Grid - Zero Video Decoder Lag */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {userMediaItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (item.type === "video") {
                              openVerticalFeed(selectedUser.id, item.parentPost?.id);
                            } else {
                              openLightbox(userMediaItems, idx, item.parentPost);
                            }
                          }}
                          className="relative aspect-[9/13] rounded-2xl overflow-hidden cursor-pointer group bg-[#0d0d0d] border border-white/10 hover:border-white/30 transition-colors shadow-md active:scale-95"
                        >
                          {/* Lightweight static poster or placeholder */}
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt="Video Poster"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181818] to-[#0a0a0a] p-4 text-center">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                              </div>
                              <span className="text-xs font-bold text-white line-clamp-2">
                                {item.parentPost?.content || `Video #${idx + 1}`}
                              </span>
                            </div>
                          )}

                          {/* Overlay card info */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-between p-2.5 pointer-events-none">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/15">
                                #{idx + 1}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/15">
                                HD
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-1">
                                <Play className="w-3 h-3 fill-white" />
                                <span className="text-[11px] font-semibold">
                                  {formatNumber(item.parentPost?.stats?.likes || 150)}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-300 font-mono">Dikey İzle</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Henüz video yüklenmemiş.
                  </div>
                )}
              </div>
            )}

            {activeTab === "tweets" && (
              <div className="flex flex-col gap-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Henüz gönderi paylaşılmamış.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
