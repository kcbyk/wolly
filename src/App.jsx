import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import SidebarLeft from "./components/SidebarLeft";
import SidebarRight from "./components/SidebarRight";
import PostCard from "./components/PostCard";
import VerticalFeed from "./components/VerticalFeed";
import AdminPanel from "./components/AdminPanel";
import MediaLightbox from "./components/MediaLightbox";
import UserProfileModal from "./components/UserProfileModal";
import CommentsModal from "./components/CommentsModal";
import CreatePostModal from "./components/CreatePostModal";
import Toast from "./components/Toast";
import { Search, X } from "lucide-react";

function MainFeed() {
  const { 
    posts, 
    activeTab, 
    setActiveTab,
    searchQuery,
    setSearchQuery,
    layoutMode,
    importScrapedData,
    showToast
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync hash routing & Automatic 1-Tap Bookmarklet Importer
  useEffect(() => {
    const handleHash = () => {
      const hashStr = window.location.hash.replace("#", "");

      // Check if redirected from Bookmarklet with import payload
      if (hashStr.startsWith("import=")) {
        try {
          const raw = decodeURIComponent(hashStr.replace("import=", ""));
          const data = JSON.parse(raw);
          if (data && data.videos && data.videos.length > 0) {
            const username = data.user || "sotwe_user";
            const nowTs = Date.now();
            const newPosts = data.videos.map((mp4Url, idx) => ({
              id: `${username}_import_${nowTs}_${idx}`,
              userId: username,
              content: `@${username} Videosu #${idx + 1}`,
              createdAt: "Şimdi",
              mediaType: "video",
              media: [{
                type: "video",
                url: mp4Url,
                poster: "",
                alt: `@${username} video`
              }],
              stats: {
                likes: 120 + idx * 10,
                replies: 10 + idx,
                retweets: 35 + idx * 2,
                bookmarks: 18
              }
            }));

            const newUser = {
              id: username,
              name: username,
              handle: username,
              avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
              bio: `@${username} Sotwe Medyaları`,
              verified: true,
              badgeType: "blue",
              stats: { followers: 5000, following: 150, posts: newPosts.length }
            };

            importScrapedData(newPosts, newUser, false);
            showToast(`🎉 ${newPosts.length} video otomatik olarak aktarıldı!`);
            window.location.hash = "";
            setActiveTab("all");
            return;
          }
        } catch (err) {
          console.error("Import hash parse error:", err);
        }
      }

      if (hashStr === "admin") {
        setActiveTab("admin");
      } else if (hashStr === "vertical") {
        setActiveTab("vertical");
      } else if (hashStr === "all") {
        setActiveTab("all");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [importScrapedData, showToast, setActiveTab]);

  // Search filtering
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const matchContent = post.content?.toLowerCase().includes(query);
    const matchUser = post.userId?.toLowerCase().includes(query);
    return matchContent || matchUser;
  });

  // 1. Admin & Otomasyon Paneli
  if (activeTab === "admin") {
    return (
      <>
        <AdminPanel onBack={() => setActiveTab("all")} />
        <MediaLightbox />
        <UserProfileModal />
        <Toast />
      </>
    );
  }

  // 2. Dikey Video Tam Ekran Görünümü
  if (activeTab === "vertical") {
    return (
      <div className="fixed inset-0 bg-black text-slate-100 font-sans overflow-hidden">
        <VerticalFeed onBack={() => setActiveTab("all")} />
        <MediaLightbox />
        <UserProfileModal />
        <CommentsModal />
        <CreatePostModal />
        <Toast />
      </div>
    );
  }

  // 3. Normal Akış Görünümü
  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-[#212121] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex justify-center gap-6 px-3 sm:px-6 py-6">
        
        {/* Left Sidebar */}
        <SidebarLeft 
          isOpenMobile={mobileMenuOpen} 
          onCloseMobile={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl min-w-0 flex flex-col gap-5">

          {/* Active Search Indicator */}
          {searchQuery && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141414] border border-white/15 text-slate-200 text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>
                  Arama sonucu: <strong className="text-white">"{searchQuery}"</strong>
                </span>
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
              >
                Temizle <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Feed Posts */}
          {filteredPosts.length > 0 ? (
            <div
              className={
                layoutMode === "masonry"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
                  : "flex flex-col gap-4"
              }
            >
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 my-8">
              <div className="w-16 h-16 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Sonuç Bulunamadı</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                "{searchQuery}" ile eşleşen gönderi bulunamadı.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-5 py-2.5 rounded-full bg-[#212121] hover:bg-[#2c2c2c] text-white text-xs font-bold transition-all shadow-lg border border-white/15 cursor-pointer"
              >
                Aramayı Temizle
              </button>
            </div>
          )}

        </main>

        {/* Right Sidebar */}
        <SidebarRight />

      </div>

      {/* Global Modals & Overlays */}
      <MediaLightbox />
      <UserProfileModal />
      <CommentsModal />
      <CreatePostModal />
      <Toast />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainFeed />
    </AppProvider>
  );
}
