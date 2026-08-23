import React from "react";
import { Home, RectangleVertical, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function SidebarLeft({ isOpenMobile, onCloseMobile }) {
  const { activeTab, setActiveTab, posts } = useApp();

  const verticalCount = posts.filter(
    (p) => p.mediaType === "video" || p.media?.some((m) => m.type === "video")
  ).length;

  const navItems = [
    { id: "all", label: "Akış", icon: Home, count: posts.length },
    { id: "vertical", label: "Dikey Video", icon: RectangleVertical, count: verticalCount },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-20 self-start gap-4">
        <div className="glass-card rounded-2xl p-3 border border-white/10 bg-[#141414] shadow-xl flex flex-col gap-1.5">
          <div className="px-3 py-1.5 mb-1 flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Menü
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#212121] text-white border border-white/20 shadow-md ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? "bg-white text-black font-bold shadow-sm"
                        : "bg-[#1c1c1c] text-slate-400 border border-white/5"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#141414] border-r border-white/10 flex flex-col p-5 gap-5 transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="font-extrabold text-white text-base tracking-wide">Menü</span>
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#212121] text-white border border-white/20 shadow-md"
                    : "text-slate-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? "bg-white text-black font-bold"
                        : "bg-[#1c1c1c] text-slate-400 border border-white/5"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
