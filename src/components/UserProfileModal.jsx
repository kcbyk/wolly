import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Film, 
  Share2 
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
              Medyalar ({userMediaItems.length})
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userMediaItems.length > 0 ? (
                  userMediaItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(userMediaItems, idx, item.parentPost)}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-black border border-white/10"
                    >
                      {item.type === "video" ? (
                        <div className="w-full h-full relative">
                          <img
                            src={item.poster || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80"}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Film className="w-6 h-6 text-white" />
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
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
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
