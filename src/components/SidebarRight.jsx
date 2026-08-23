import React from "react";
import { CheckCircle, Users, Activity } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function SidebarRight() {
  const { 
    users, 
    openProfile, 
    following, 
    toggleFollow,
    posts 
  } = useApp();

  const suggestedUsers = users.slice(0, 4);
  const totalMedia = posts.reduce((acc, p) => acc + (p.media?.length || 0), 0);

  return (
    <aside className="w-80 hidden xl:flex flex-col gap-5 p-4 pl-0">
      
      {/* Live Activity / Stats Widget */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Activity className="w-4 h-4 text-slate-400" />
          <span>Platform İstatistikleri</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1c1c1c] p-3 rounded-xl border border-white/5 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">Toplam Gönderi</span>
            <span className="text-base font-bold text-white font-mono">{posts.length}</span>
          </div>
          <div className="bg-[#1c1c1c] p-3 rounded-xl border border-white/5 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">Medya & Video</span>
            <span className="text-base font-bold text-slate-200 font-mono">{totalMedia}</span>
          </div>
        </div>
      </div>

      {/* Suggested Creators (Who to Follow) */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Users className="w-4 h-4 text-slate-300" />
          <span>Önerilen Profiller</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {suggestedUsers.map((user) => {
            const isFollowed = following.includes(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-[#1f1f1f] transition-colors group cursor-pointer border border-transparent hover:border-white/5"
                onClick={() => openProfile(user)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10 group-hover:ring-white/30 transition-all"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors truncate">
                        {user.name}
                      </span>
                      {user.verified && (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 fill-white/10" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">
                      @{user.handle}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(user.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    isFollowed
                      ? "border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                      : "bg-white text-slate-950 hover:bg-slate-200 shadow-sm font-bold"
                  }`}
                >
                  {isFollowed ? "Takipte" : "Takip Et"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
