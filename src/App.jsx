import React, { useState, useEffect, useMemo } from "react";
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
import ErrorBoundary from "./components/ErrorBoundary";
import { Search, X, Compass, Flame, Clock } from "lucide-react";
import { buildForYouFeed, buildTrendingFeed } from "./utils/algorithm";

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
  const [visibleCount, setVisibleCount] = useState(12);
  const [feedFilter, setFeedFilter] = useState("foryou"); // 'foryou' | 'latest' | 'popular'

  // Reset pagination on filter or search change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, feedFilter]);

  // Smooth Infinite Scroll
  useEffect(() => {
    const handleWindowScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 900
      ) {
        setVisibleCount((prev) => Math.min(prev + 12, posts.length));
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [posts.length]);

  // Sync hash routing & Automatic 1-Tap Bookmarklet Importer
  useEffect(() => {
    const handleHash = () => {
      const hashStr = window.location.hash.replace("#", "");

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

  // Keşfet / Algoritma İşleme
  const processedPosts = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return posts.filter(
        (p) => p.content?.toLowerCase().includes(q) || p.userId?.toLowerCase().includes(q)
      );
    }

    if (feedFilter === "foryou") {
      return buildForYouFeed(posts);
    } else if (feedFilter === "popular") {
      return buildTrendingFeed(posts);
    }
    return posts; // 'latest'
  }, [posts, searchQuery, feedFilter]);

  // 1. Admin & Otomasyon Paneli
  if (activeTab === "admin") {
    return (
      <ErrorBoundary onReset={() => setActiveTab("all")}>
        <AdminPanel
          onBack={() => {
            window.location.hash = "";
            setActiveTab("all");
          }}
        />
        <MediaLightbox />
        <UserProfileModal />
        <Toast />
      </ErrorBoundary>
    );
  }

  // 2. Dikey Video Tam Ekran Görünümü
  if (activeTab === "vertical") {
    return (
      <div className="fixed inset-0 bg-black text-slate-100 font-sans overflow-hidden">
        <VerticalFeed
          onBack={() => {
            window.location.hash = "";
            setActiveTab("all");
          }}
        />
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

          {/* Feed Filter Bar: Keşfet (Senin İçin) / En Yeniler / Popüler */}
          {!searchQuery && (
            <div className="glass-card rounded-2xl p-1.5 flex items-center justify-between border border-white/10 bg-[#141414] shadow-lg">
              <button
                onClick={() => setFeedFilter("foryou")}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  feedFilter === "foryou"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Compass className={`w-4 h-4 ${feedFilter === "foryou" ? "text-black" : "text-slate-400"}`} />
                <span>Senin İçin (Keşfet)</span>
              </button>

              <button
                onClick={() => setFeedFilter("popular")}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  feedFilter === "popular"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Flame className={`w-4 h-4 ${feedFilter === "popular" ? "text-black" : "text-amber-400"}`} />
                <span>Popüler</span>
              </button>

              <button
                onClick={() => setFeedFilter("latest")}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  feedFilter === "latest"
                    ? "bg-white text-black shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Clock className={`w-4 h-4 ${feedFilter === "latest" ? "text-black" : "text-slate-400"}`} />
                <span>En Yeniler</span>
              </button>
            </div>
          )}

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
          {processedPosts.length > 0 ? (
            <>
              <div
                className={
                  layoutMode === "masonry"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
                    : "flex flex-col gap-4"
                }
              >
                {processedPosts.slice(0, visibleCount).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* End of list or Loading More Indicator */}
              {visibleCount < processedPosts.length && (
                <div className="py-6 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-6 py-2.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
                  >
                    Daha Fazla Göster ({processedPosts.length - visibleCount} video daha)
                  </button>
                </div>
              )}
            </>
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
