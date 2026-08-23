import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Film, 
  Share2,
  Play,
  Sparkles
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

  const [activeTab, setActiveTab] = useState("tweets");

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
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={closeProfile}
    >
      <div 
        className="glass-modal w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-auto text-slate-100 max-h-[90vh] flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar">
          
          {/* Banner */}
          <div className="relative h-36 sm:h-48 w-full bg-[#0a0e16]">
            {selectedUser.banner && (
              <img
                src={selectedUser.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            
            <button
              onClick={closeProfile}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#212121] hover:bg-[#2d2d2d] text-white backdrop-blur-md transition-colors border border-white/15 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile info */}
          <div className="px-6 pb-4 relative">
            <div className="flex justify-between items-end -mt-14 sm:-mt-16 mb-4">
              <div className="relative">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-black shadow-2xl bg-black"
                />
                {selectedUser.badgeType === "gold" && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-black">
                    ✓
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-full bg-[#212121] border border-white/10 hover:bg-[#2d2d2d] text-slate-300 transition-colors"
                  title="Profili Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleFollow(selectedUser.id)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                    isFollowed
                      ? "border border-white/10 text-slate-300 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                      : "bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/10"
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
            <p className="text-sm text-slate-400 mb-3">@{selectedUser.handle}</p>

            <p className="text-sm text-slate-200 leading-relaxed mb-4">
              {selectedUser.bio}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-4">
              {selectedUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedUser.location}</span>
                </div>
              )}
              {selectedUser.joined && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Katıldı: {selectedUser.joined}</span>
                </div>
              )}
            </div>

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
                <span className="text-slate-400 text-xs">Gönderi</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-black/70 sticky top-0 z-10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("tweets")}
              className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
                activeTab === "tweets" ? "text-white bg-[#212121]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gönderiler ({userPosts.length})
              {activeTab === "tweets" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
                activeTab === "media" ? "text-white bg-[#212121]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Medyalar & Videolar ({userMediaItems.length})
              {activeTab === "media" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
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

            {activeTab === "media" && (
              <div className="flex flex-col gap-3">
                {userMediaItems.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-400">
                        {userMediaItems.filter(m => m.type === "video").length} Video • Dikey formatta izlemek için tıklayın
                      </span>
                    </div>

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
                          className="relative aspect-square sm:aspect-[9/14] rounded-2xl overflow-hidden cursor-pointer group bg-[#101010] border border-white/10 hover:border-white/40 transition-all shadow-lg active:scale-95"
                        >
                          {item.type === "video" ? (
                            <div className="w-full h-full relative">
                              <video
                                src={item.url}
                                muted
                                playsInline
                                preload="metadata"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                                <div className="flex justify-end">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-white border border-white/20">
                                    HD
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-white">
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                      <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                                    </div>
                                    <span className="text-[11px] font-bold">{formatNumber(item.parentPost?.stats?.likes || 150)}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-300 font-mono">Dikey Aç 🎬</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt="User Media"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-center py-12 text-slate-500 text-sm">
                    Henüz medya yüklenmemiş.
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
