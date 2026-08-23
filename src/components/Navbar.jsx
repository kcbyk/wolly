import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  X, 
  LayoutGrid, 
  Rows3, 
  CheckCircle,
  Menu,
  RectangleVertical
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Navbar({ onToggleMobileMenu }) {
  const { 
    activeTab,
    searchQuery, 
    setSearchQuery, 
    layoutMode, 
    setLayoutMode, 
    users, 
    openProfile 
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const matchedUsers = searchQuery.trim()
    ? users.filter((u) => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.handle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="glass-header sticky top-0 z-30 w-full px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-h-[42px]">
        
        {/* Mobile Menu Button — sadece mobilde (< 768px) görünür */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2.5 rounded-2xl bg-[#141414] border border-white/10 text-slate-300 hover:text-white hover:bg-[#212121] shrink-0 cursor-pointer"
          title="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar — Sadece "Akış" sekmesinde görünür, "Dikey Video" sekmesinde gizlenir */}
        {activeTab !== "vertical" ? (
          <div ref={searchRef} className="flex-1 max-w-2xl relative mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Kullanıcı veya kelime ara..."
                className="w-full pl-11 pr-10 py-2.5 rounded-full bg-[#141414] border border-white/10 focus:border-white/30 focus:bg-[#1a1a1a] text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner focus:ring-1 focus:ring-white/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchFocused && matchedUsers.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 rounded-2xl bg-[#141414] border border-white/15 shadow-2xl p-2 z-40 max-h-80 overflow-y-auto backdrop-blur-2xl">
                <span className="text-[11px] font-bold text-slate-400 px-3 py-1 block uppercase tracking-wider">
                  Kullanıcılar
                </span>
                {matchedUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      openProfile(u);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#212121] cursor-pointer transition-colors"
                  >
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-100 truncate">{u.name}</span>
                        {u.verified && <CheckCircle className="w-3.5 h-3.5 text-slate-300 fill-white/10 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block">@{u.handle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-200">
            <RectangleVertical className="w-4 h-4 text-white" />
            <span>Dikey Video</span>
          </div>
        )}

        {/* Layout Toggle (Grid / Feed) — Sadece Akış sekmesinde göster */}
        {activeTab !== "vertical" ? (
          <div className="flex items-center bg-[#141414] border border-white/10 p-1 rounded-full shrink-0">
            <button
              onClick={() => setLayoutMode("masonry")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                layoutMode === "masonry" ? "bg-[#212121] text-white border border-white/20 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Masonry Grid Düzeni"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode("feed")}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                layoutMode === "feed" ? "bg-[#212121] text-white border border-white/20 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tek Sütun Akış Düzeni"
            >
              <Rows3 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-8 shrink-0 md:hidden" />
        )}

      </div>
    </header>
  );
}
