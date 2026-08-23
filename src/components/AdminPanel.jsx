import React, { useState } from "react";
import { 
  ArrowLeft, Download, Upload, Trash2, Plus, Sparkles, 
  Search, RefreshCw, CheckCircle, AlertCircle, Video, User, 
  Layers, Database, FileCode, Check, ExternalLink 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { autoScrapeSotweProfile, parseSotweHtml, parseSotweData, extractUsername } from "../utils/sotweScraper";

export default function AdminPanel({ onBack }) {
  const { 
    posts, 
    users, 
    importScrapedData, 
    deletePost, 
    deleteUserPosts, 
    resetToDefaultData, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState("auto"); // 'auto' | 'paste' | 'manual' | 'manage'

  // Auto scrape state
  const [profileInput, setProfileInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState("");
  const [scrapedResult, setScrapedResult] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Paste dump state
  const [pasteInput, setPasteInput] = useState("");
  const [pasteUsername, setPasteUsername] = useState("");
  const [isParsingPaste, setIsParsingPaste] = useState(false);

  // Manual video add state
  const [manualUsername, setManualUsername] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualContent, setManualContent] = useState("");

  // Manage search
  const [manageSearch, setManageSearch] = useState("");

  const totalVideos = posts.filter(p => p.mediaType === "video" || p.media?.some(m => m.type === "video")).length;

  // 1. Auto Scrape Handler
  const handleAutoScrape = async (e) => {
    e.preventDefault();
    if (!profileInput.trim()) {
      showToast("Lütfen bir Sotwe profil linki veya kullanıcı adı girin!", "error");
      return;
    }

    setIsScraping(true);
    setScrapedResult(null);
    setScrapeStatus("Başlatılıyor...");

    try {
      const result = await autoScrapeSotweProfile(profileInput, (msg) => {
        setScrapeStatus(msg);
      });

      if (result.success && result.posts.length > 0) {
        setScrapedResult(result);
        setScrapeStatus(`🎉 Başarılı! ${result.posts.length} gönderi/video bulundu.`);
        showToast(`${result.posts.length} video ve profil bilgisi çekildi! 🎯`);
      } else {
        setScrapeStatus("Gönderi bulunamadı veya profil gizli.");
        showToast("Profilde video bulunamadı.", "error");
      }
    } catch (err) {
      setScrapeStatus(`Hata: ${err.message}`);
      showToast(err.message, "error");
    } finally {
      setIsScraping(false);
    }
  };

  // Apply Scraped Result to Site
  const handleApplyResult = () => {
    if (!scrapedResult) return;
    importScrapedData(scrapedResult.posts, scrapedResult.user, replaceExisting);
    setScrapedResult(null);
    setProfileInput("");
    setScrapeStatus("");
  };

  // 2. Paste Dump Handler (HTML or JSON)
  const handleParsePaste = () => {
    if (!pasteInput.trim()) {
      showToast("Lütfen kaynak kodunu veya JSON verisini yapıştırın!", "error");
      return;
    }

    setIsParsingPaste(true);
    try {
      let result = null;
      // Try JSON first
      try {
        const json = JSON.parse(pasteInput);
        result = parseSotweData(json, pasteUsername || "kullanici");
      } catch {
        // HTML dump parsing
        result = parseSotweHtml(pasteInput, pasteUsername || "kullanici");
      }

      if (result && result.success && result.posts.length > 0) {
        setScrapedResult(result);
        showToast(`${result.posts.length} adet video başarıyla ayıklandı! 🚀`);
      } else {
        showToast("Yapıştırılan veriden video çıkarılamadı. Lütfen geçerli bir HTML veya JSON yapıştırın.", "error");
      }
    } catch (err) {
      showToast("Ayrıştırma hatası: " + err.message, "error");
    } finally {
      setIsParsingPaste(false);
    }
  };

  // 3. Manual Add Video Handler
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualVideoUrl.trim()) {
      showToast("Lütfen video MP4 linki girin!", "error");
      return;
    }

    const username = manualUsername.trim() || "video_creator";
    const newPost = {
      id: `manual_${Date.now()}`,
      userId: username,
      content: manualContent.trim() || `@${username} yeni videosu`,
      createdAt: "Şimdi",
      mediaType: "video",
      media: [{
        type: "video",
        url: manualVideoUrl.trim(),
        poster: "",
        alt: manualContent || "Video"
      }],
      stats: { likes: 50, replies: 5, retweets: 12, bookmarks: 8 }
    };

    const newUser = {
      id: username,
      name: username,
      handle: username,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      bio: `@${username} paylaşımları`,
      verified: false,
      badgeType: "none",
      stats: { followers: 100, following: 20, posts: 1 }
    };

    importScrapedData([newPost], newUser, false);
    setManualVideoUrl("");
    setManualContent("");
    showToast("Video başarıyla eklendi! 🎬");
  };

  // Backup Export
  const handleExportBackup = () => {
    const data = {
      posts,
      users,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sotwe-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Tüm site veritabanı JSON olarak indirildi! 💾");
  };

  // Backup Import
  const handleImportBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (json.posts && Array.isArray(json.posts)) {
          importScrapedData(json.posts, json.users || [], true);
          showToast("Yedek başarıyla geri yüklendi! 🔄");
        } else {
          showToast("Geçersiz yedek dosyası formatı!", "error");
        }
      } catch (err) {
        showToast("Dosya okunamadı: " + err.message, "error");
      }
    };
    reader.readAsText(file);
  };

  const filteredPosts = posts.filter(p => 
    p.content.toLowerCase().includes(manageSearch.toLowerCase()) ||
    p.userId.toLowerCase().includes(manageSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans pb-16">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Siteye Dön"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>⚙️ Otomasyon & Admin Paneli</span>
              </h1>
              <p className="text-xs text-slate-400">Sotwe profillerini ve videolarını otomatik içeri aktarın</p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-[#141414] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-white" />
              <span>{totalVideos} Video</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#141414] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white" />
              <span>{users.length} Profil</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("auto")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "auto"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Otomatik Sotwe Çekici</span>
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "paste"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>HTML / JSON Yapıştır</span>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "manual"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Manuel Video Ekle</span>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "manage"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Veritabanı & Yönetim ({posts.length})</span>
          </button>
        </div>

        {/* ── TAB 1: AUTO SCRAPER ── */}
        {activeTab === "auto" && (
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-white/10 bg-[#141414]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  Sotwe URL Otomatik Profil Çekici
                </h2>
                <p className="text-xs text-slate-400">
                  Herhangi bir Sotwe profil linkini veya kullanıcı adını girin. Sistem videoları ve profil detaylarını otomatik çeker.
                </p>
              </div>

              <form onSubmit={handleAutoScrape} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={profileInput}
                    onChange={(e) => setProfileInput(e.target.value)}
                    placeholder="https://www.sotwe.com/ardakara222 veya @kullanici_adi"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white transition-all font-mono"
                    disabled={isScraping}
                  />
                  {profileInput && (
                    <button
                      type="button"
                      onClick={() => setProfileInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isScraping || !profileInput.trim()}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-50 text-black text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Çekiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Videoları Çek</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status feedback */}
              {scrapeStatus && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>{scrapeStatus}</span>
                </div>
              )}
            </div>

            {/* Scraped Preview Card */}
            {scrapedResult && (
              <div className="glass-card rounded-2xl p-6 border border-white/20 bg-[#141414] flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={scrapedResult.user?.avatar}
                      alt={scrapedResult.user?.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                        {scrapedResult.user?.name}
                        {scrapedResult.user?.verified && <CheckCircle className="w-4 h-4 text-white" />}
                      </h3>
                      <p className="text-xs text-slate-400">@{scrapedResult.user?.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-mono text-xs font-bold">
                      {scrapedResult.posts.length} Gönderi / Video
                    </span>
                  </div>
                </div>

                {scrapedResult.user?.bio && (
                  <p className="text-xs text-slate-300 italic">{scrapedResult.user.bio}</p>
                )}

                {/* Video Previews Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                  {scrapedResult.posts.slice(0, 8).map((p, idx) => {
                    const video = p.media?.find(m => m.type === "video");
                    return (
                      <div key={idx} className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/10">
                        {video ? (
                          <video
                            src={video.url}
                            poster={video.poster}
                            muted
                            playsInline
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Görsel</div>
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          #{idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Import Options & Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded accent-white"
                    />
                    <span>Mevcut tüm gönderileri silip sadece bu profili yükle</span>
                  </label>

                  <button
                    onClick={handleApplyResult}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Siteye Aktar ve Yayınla ({scrapedResult.posts.length} Video)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: HTML / JSON PASTE PARSER ── */}
        {activeTab === "paste" && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-white/10 bg-[#141414]">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-white" />
                Sotwe Sayfa Kaynağı / JSON Yapıştırıcı
              </h2>
              <p className="text-xs text-slate-400">
                Sotwe sayfasına gidin, sağ tıklayıp <b>"Sayfa Kaynağını Görüntüle"</b> (Ctrl+U) yapın veya ağdan dönen JSON yanıtını kopyalayıp buraya yapıştırın. Sistem tüm MP4 video URL'lerini ve gönderileri anında çıkarır.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={pasteUsername}
                onChange={(e) => setPasteUsername(e.target.value)}
                placeholder="Kullanıcı adı (İsteğe bağlı, örn: ardakara222)"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white font-mono"
              />

              <textarea
                rows={8}
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="HTML sayfa kaynağını veya JSON kodunu buraya yapıştırın..."
                className="w-full p-4 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-white leading-relaxed resize-y"
              />

              <button
                onClick={handleParsePaste}
                disabled={isParsingPaste || !pasteInput.trim()}
                className="w-full sm:w-auto self-end px-6 py-3 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-50 text-black text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Videoları Ayıkla ve İçe Aktar</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: MANUAL VIDEO ADD ── */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualAdd} className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-white/10 bg-[#141414]">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                Manuel Video Ekle
              </h2>
              <p className="text-xs text-slate-400">Doğrudan bir MP4 video bağlantısı girerek siteye yeni video ekleyin.</p>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                placeholder="Kullanıcı Adı (Örn: ardakara222)"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white font-mono"
              />

              <input
                type="url"
                required
                value={manualVideoUrl}
                onChange={(e) => setManualVideoUrl(e.target.value)}
                placeholder="Video MP4 Linki (https://...mp4)"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white font-mono"
              />

              <textarea
                rows={3}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Açıklama / Tweet Metni (İsteğe bağlı)"
                className="w-full p-3 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white resize-none"
              />

              <button
                type="submit"
                disabled={!manualVideoUrl.trim()}
                className="w-full sm:w-auto self-end px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Videoyu Ekle</span>
              </button>
            </div>
          </form>
        )}

        {/* ── TAB 4: DATABASE & MANAGEMENT ── */}
        {activeTab === "manage" && (
          <div className="flex flex-col gap-6">
            {/* Action Bar */}
            <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 bg-[#141414]">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Gönderilerde ara..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white"
                />
              </div>

              {/* Backup & Reset buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2e2e2e] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Yedek İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yedek İndir</span>
                </button>

                <label className="px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2e2e2e] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Yedek Yükle</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupFile}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    if (window.confirm("Tüm gönderiler ve profiller varsayılan haline sıfırlansın mı?")) {
                      resetToDefaultData();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Posts Table / List */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-[#141414]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>KAYITLI GÖNDERİLER ({filteredPosts.length})</span>
                <span>İŞLEMLER</span>
              </div>

              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {filteredPosts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">Gönderi bulunamadı.</div>
                ) : (
                  filteredPosts.map((post, idx) => {
                    const video = post.media?.find(m => m.type === "video");
                    return (
                      <div key={post.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-slate-500 w-6">#{idx + 1}</span>
                          
                          {/* Media Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {video ? (
                              <video
                                src={video.url}
                                muted
                                playsInline
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="w-4 h-4 text-slate-600" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">@{post.userId}</span>
                            <p className="text-xs text-slate-400 line-clamp-1 truncate">{post.content || "Video Gönderisi"}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{post.createdAt}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {video && (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              title="Orijinal Video Bağlantısı"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => deletePost(post.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Gönderiyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
