import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Download, Upload, Trash2, Plus, Sparkles, 
  Search, RefreshCw, CheckCircle, Video, User, 
  Database, Check, ExternalLink, Clipboard, Smartphone,
  Zap, ShieldAlert, ArrowRight, Copy
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { autoScrapeSotweProfile, parseSotweHtml, parseSotweData, extractUsername } from "../utils/sotweScraper";

export default function AdminPanel({ onBack }) {
  const { 
    posts, 
    users, 
    importScrapedData, 
    deletePost, 
    resetToDefaultData, 
    showToast 
  } = useApp();

  const handleBack = () => {
    window.location.hash = "";
    if (onBack) onBack();
  };

  const [activeTab, setActiveTab] = useState("extractor"); // 'extractor' | 'manual' | 'manage'

  // Extractor state
  const [profileUrl, setProfileUrl] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [extractedResult, setExtractedResult] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [showMobileBridge, setShowMobileBridge] = useState(false);

  // Manual video add state
  const [manualUsername, setManualUsername] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualContent, setManualContent] = useState("");

  // Manage search
  const [manageSearch, setManageSearch] = useState("");

  // Tweet URL import state
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetImporting, setTweetImporting] = useState(false);
  const [tweetResult, setTweetResult] = useState(null);
  const [tweetError, setTweetError] = useState("");

  const totalVideos = posts.filter(p => p.mediaType === "video" || p.media?.some(m => m.type === "video")).length;
  const detectedUsername = extractUsername(profileUrl);

  // 1. Auto & Semi-Auto Scrape Handler
  const handleStartScrape = async () => {
    if (!profileUrl.trim()) {
      showToast("Lütfen bir Sotwe linki veya kullanıcı adı girin!", "error");
      return;
    }

    setIsProcessing(true);
    setExtractedResult(null);
    setStatusMessage("Otomatik taranıyor...");

    try {
      const result = await autoScrapeSotweProfile(profileUrl, (msg) => {
        setStatusMessage(msg);
      });

      if (result.success && result.posts.length > 0) {
        setExtractedResult(result);
        setStatusMessage(`🎉 Başarılı! ${result.posts.length} video bulundu.`);
        showToast(`${result.posts.length} video başarıyla çekildi! 🎯`);
        setShowMobileBridge(false);
      } else {
        // Cloudflare block triggered -> Activate Semi-Auto Bridge
        setShowMobileBridge(true);
        setStatusMessage("Cloudflare koruması devrede. Yarı otomatik mobil köprü başlatıldı.");
      }
    } catch {
      // Cloudflare block triggered -> Open Semi-Auto Bridge automatically
      setShowMobileBridge(true);
      setStatusMessage("Cloudflare koruması devrede. Yarı otomatik mobil köprü başlatıldı.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Read from Clipboard (1-Tap on Mobile!)
  const handleReadFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        showToast("Tarayıcınız otomatik pano okumayı desteklemiyor. Metni kutuya yapıştırın.", "error");
        return;
      }

      setIsProcessing(true);
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        showToast("Pano boş! Lütfen Sotwe sayfasında metni kopyalayın.", "error");
        setIsProcessing(false);
        return;
      }

      setPasteData(text);
      processExtractedContent(text);
    } catch (err) {
      showToast("Pano okuma izni verilmedi: " + err.message, "error");
      setIsProcessing(false);
    }
  };

  // 3. Process Extracted Content
  const processExtractedContent = (rawText) => {
    setIsProcessing(true);
    setStatusMessage("Videolar ayıklanıyor...");

    try {
      const targetUser = detectedUsername || "sotwe_user";
      let result = null;

      // Try JSON first
      try {
        const json = JSON.parse(rawText);
        result = parseSotweData(json, targetUser);
      } catch {
        // Fallback to HTML & MP4 regex parser
        result = parseSotweHtml(rawText, targetUser);
      }

      if (result && result.success && result.posts.length > 0) {
        setExtractedResult(result);
        setStatusMessage(`🎉 Harika! ${result.posts.length} adet HD MP4 video başarıyla ayıklandı.`);
        showToast(`${result.posts.length} adet video ayıklandı! 🚀`);
        setShowMobileBridge(false);
      } else {
        setStatusMessage("❌ Yapıştırılan veride video bulunamadı. Lütfen sayfadaki tüm metni kopyaladığınızdan emin olun.");
        showToast("Video bulunamadı. Sayfadaki metni kopyaladığınızdan emin olun.", "error");
      }
    } catch (err) {
      setStatusMessage(`Hata: ${err.message}`);
      showToast("Ayrıştırma hatası: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Publish & Apply to Site
  const handleApplyToSite = () => {
    if (!extractedResult) return;
    importScrapedData(extractedResult.posts, extractedResult.user, replaceExisting);
    setExtractedResult(null);
    setPasteData("");
    setProfileUrl("");
    setStatusMessage("");
    setShowMobileBridge(false);
  };

  // 5. Manual Single Video Add
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualVideoUrl.trim()) {
      showToast("Lütfen video MP4 linki girin!", "error");
      return;
    }

    const username = manualUsername.trim() || "creator";
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

  // 5b. Tweet URL -> Otomatik Video Import (fxtwitter)
  const handleTweetUrlImport = async (e) => {
    e?.preventDefault();
    const url = tweetUrl.trim();
    if (!url) {
      showToast("Lütfen bir tweet URL'si girin!", "error");
      return;
    }

    setTweetImporting(true);
    setTweetResult(null);
    setTweetError("");

    try {
      // Sunucu üzerinden fxtwitter API'sini çağır
      const apiUrl = `/api/tweet?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.success && data.post) {
        setTweetResult(data);
        showToast("Video bulundu! Siteye eklemek için onaylayın. ✅");
      } else {
        setTweetError(data.error || "Bu tweet'te video bulunamadı.");
        showToast(data.error || "Video bulunamadı.", "error");
      }
    } catch (err) {
      setTweetError("Bağlantı hatası: " + err.message);
      showToast("Bağlantı hatası.", "error");
    } finally {
      setTweetImporting(false);
    }
  };

  const handleTweetResultApply = () => {
    if (!tweetResult?.post) return;
    const post = tweetResult.post;
    const user = post.user || {
      id: post.userId,
      name: post.userId,
      handle: post.userId,
      avatar: `https://unavatar.io/twitter/${post.userId}`,
      verified: false,
      badgeType: "none",
      stats: { followers: 0, following: 0, posts: 1 }
    };
    importScrapedData([post], user, false);
    setTweetResult(null);
    setTweetUrl("");
    setTweetError("");
    showToast("Video siteye eklendi! 🎬");
  };

  // 6. Backup Export/Import
  const handleExportBackup = () => {

    const data = { posts, users, exportedAt: new Date().toISOString(), version: "1.0" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sotwe-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Tüm veritabanı JSON olarak indirildi! 💾");
  };

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
          showToast("Geçersiz yedek dosyası!", "error");
        }
      } catch (err) {
        showToast("Hata: " + err.message, "error");
      }
    };
    reader.readAsText(file);
  };

  const filteredPosts = posts.filter(p => 
    p.content?.toLowerCase().includes(manageSearch.toLowerCase()) ||
    p.userId?.toLowerCase().includes(manageSearch.toLowerCase())
  );

  const bookmarkletCode = typeof window !== "undefined"
    ? `javascript:(function(){try{var v=Array.from(document.querySelectorAll("video")).map(function(x){return x.src||(x.querySelector("source")?x.querySelector("source").src:"");}).filter(Boolean);var html=document.documentElement.innerHTML;var m=html.match(/https:\\/\\/[^"'\\s\\\\<>]+\\.mp4[^"'\\s\\\\<>]*/g)||[];var mp4s=m.map(function(u){return u.replace(/\\\\u0026/g,"&").replace(/\\\\/g,"");});var all=Array.from(new Set(v.concat(mp4s))).filter(function(u){return u.indexOf("twimg.com")!==-1||u.indexOf(".mp4")!==-1;});if(all.length===0){alert("Sayfada video bulunamadi! Lutfen sayfayi asagi kaydirip tekrar deneyin.");return;}var user=location.pathname.replace(/^\\/+/,"").split("/")[0].split("?")[0]||"sotwe_user";var payload=encodeURIComponent(JSON.stringify({user:user,videos:all}));window.location.href="${window.location.origin}/#import="+payload;}catch(e){alert("Hata: "+e.message);}})();`
    : `javascript:(function(){alert("Wolly Importer");})();`;

  const handleCopyBookmarklet = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bookmarkletCode);
      } else {
        const temp = document.createElement("textarea");
        temp.value = bookmarkletCode;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      showToast("Yer imi kodu panoya kopyalandı! 📋");
    } catch {
      showToast("Lütfen kutudaki kodu manuel kopyalayın.", "info");
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans pb-16">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Siteye Dön"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>⚡ Sotwe Otomasyon Paneli</span>
              </h1>
              <p className="text-xs text-slate-400">Mobilden ve Masaüstünden tek tıkla video çekin</p>
            </div>
          </div>

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
            onClick={() => setActiveTab("extractor")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "extractor"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Otomatik Video Çekici</span>
          </button>

          <button
            onClick={() => setActiveTab("bookmarklet")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "bookmarklet"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🪄 1-Tık Sihirli Yer İmi (Mobilde En Kolay)</span>
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
            onClick={() => setActiveTab("tweet")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "tweet"
                ? "bg-white text-black shadow-lg"
                : "bg-[#141414] text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>🔗 Tweet URL Ekle</span>
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


        {/* ── MAIN TAB: EXTRACTOR ── */}
        {activeTab === "extractor" && (
          <div className="flex flex-col gap-6">
            
            {/* Primary Input Card */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 border border-white/10 bg-[#141414]">
              
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-white" />
                  Sotwe URL'den Otomatik Video Çek
                </h2>
                <p className="text-xs text-slate-400">
                  Sotwe profil linkini veya kullanıcı adını yapıştırın ve <b>"Videoları Çek"</b> butonuna basın.
                </p>
              </div>

              {/* URL Input Form */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://www.sotwe.com/abbeyvelvett veya @kullanici_adi"
                    className="w-full px-4 py-3.5 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white font-mono"
                    disabled={isProcessing}
                  />
                  {profileUrl && (
                    <button
                      type="button"
                      onClick={() => { setProfileUrl(""); setShowMobileBridge(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStartScrape}
                  disabled={isProcessing || !profileUrl.trim()}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 text-black text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Çekiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Videoları Çek 🚀</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status indicator */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>{statusMessage}</span>
                </div>
              )}

            </div>

            {/* ── SEMI-AUTOMATIC MOBILE BRIDGE (Activates when Cloudflare is encountered) ── */}
            {showMobileBridge && (
              <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-[#17140e] flex flex-col gap-4 shadow-2xl animate-fade-in">
                
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <span>Mobil Yarı Otomatik Köprü (Cloudflare Korumasını Aşma)</span>
                    </h3>
                    <p className="text-xs text-amber-200/80">
                      Sotwe'nin bot korumasını aşmak için telefonunuzda sadece 2 saniyelik şu işlemi yapın:
                    </p>
                  </div>
                </div>

                {/* 2-Step Mobile Bridge Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  
                  {/* Step 1: Open Sotwe in new tab */}
                  <a
                    href={`https://www.sotwe.com/${detectedUsername || "abbeyvelvett"}?lang=tr`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-black/60 hover:bg-black/90 border border-white/15 text-white flex flex-col gap-2 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[11px] font-bold flex items-center justify-center">1</span>
                        Sotwe Sayfasını Aç
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sayfayı açın, herhangi bir yere basılı tutup <b>"Tümünü Seç"</b> → <b>"Kopyala"</b> yapın.
                    </p>
                  </a>

                  {/* Step 2: 1-Tap Read from Clipboard */}
                  <button
                    onClick={handleReadFromClipboard}
                    disabled={isProcessing}
                    className="p-4 rounded-xl bg-white hover:bg-slate-200 text-black flex flex-col gap-2 transition-all text-left cursor-pointer shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">2</span>
                        Panodan Otomatik Oku & Ekle
                      </span>
                      <Clipboard className="w-4 h-4 text-black" />
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      Tek tıkla kopyaladığınız içeriği okur, tüm HD MP4 videolarını anında ayıklar!
                    </p>
                  </button>

                </div>

                {/* Direct Paste Fallback textarea */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Veya metni doğrudan buraya yapıştırıp ayıklayın:</span>
                    {pasteData && (
                      <button
                        onClick={() => processExtractedContent(pasteData)}
                        className="text-xs text-white font-bold underline cursor-pointer"
                      >
                        Ayıkla →
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={pasteData}
                    onChange={(e) => {
                      setPasteData(e.target.value);
                      if (e.target.value.length > 50) {
                        processExtractedContent(e.target.value);
                      }
                    }}
                    placeholder="Kopyaladığınız metni buraya yapıştırabilirsiniz..."
                    className="w-full p-3 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-white resize-none"
                  />
                </div>

              </div>
            )}

            {/* ── EXTRACTED PREVIEW CARD ── */}
            {extractedResult && (
              <div className="glass-card rounded-2xl p-6 border border-white/20 bg-[#141414] flex flex-col gap-4 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={extractedResult.user?.avatar}
                      alt={extractedResult.user?.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                        {extractedResult.user?.name}
                        {extractedResult.user?.verified && <CheckCircle className="w-4 h-4 text-white" />}
                      </h3>
                      <p className="text-xs text-slate-400">@{extractedResult.user?.handle}</p>
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-mono text-xs font-bold">
                    {extractedResult.posts.length} HD Video Bulundu
                  </span>
                </div>

                {extractedResult.user?.bio && (
                  <p className="text-xs text-slate-300 italic">{extractedResult.user.bio}</p>
                )}

                {/* Video Previews Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                  {extractedResult.posts.slice(0, 8).map((p, idx) => {
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
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Video #{idx+1}</div>
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          #{idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Import Options & Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded accent-white"
                    />
                    <span>Mevcut tüm gönderileri silip sadece bu profili yayınla</span>
                  </label>

                  <button
                    onClick={handleApplyToSite}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Siteye Aktar ve Yayınla ({extractedResult.posts.length} Video) 🚀</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB: 1-TAP MAGIC BOOKMARKLET ── */}
        {activeTab === "bookmarklet" && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 border border-white/10 bg-[#141414]">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                🪄 1-Tık Sihirli Yer İmi (Mobilde & Masaüstünde En Kolayı)
              </h2>
              <p className="text-xs text-slate-400">
                Bu kodu tarayıcınızın yer imlerine (bookmark) bir kez ekleyin. Sotwe'de profili açıp bu yer imine bastığınız an, <b>tüm HD videoları otomatik toplayıp sitemize aktarır!</b>
              </p>
            </div>

            {/* Bookmarklet Code Box */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-black border border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">Yer İmi Kodu:</span>
                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kodu Kopyala</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={4}
                value={bookmarkletCode}
                className="w-full p-3 rounded-xl bg-[#0d0d0d] border border-white/10 text-slate-300 font-mono text-[11px] select-all focus:outline-none resize-none"
              />
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-white">Yer İmi Olarak Kaydet</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Yukarıdaki kodu kopyalayın. Tarayıcınızda herhangi bir sayfayı yer imlerine ekleyip adres (URL) kısmına bu kodu yapıştırın.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-white">Sotwe Profilini Aç</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Telefonundan veya bilgisayarından çekmek istediğin Sotwe profil sayfasını aç.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-white">Yer İmine Bas → Bitti!</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kaydettiğin yer imine bir kere bas. Sistem sayfadaki tüm videoları toplayıp doğrudan sitemizde yayınlar! 🎉
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MANUAL VIDEO ADD ── */}
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

        {/* ── TAB 3: DATABASE & MANAGEMENT ── */}
        {activeTab === "manage" && (
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 bg-[#141414]">
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

            {/* Posts List */}
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

        {/* ── TAB: TWEET URL EKLE ── */}
        {activeTab === "tweet" && (
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 border border-white/10 bg-[#141414]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-white" />
                  Tweet URL'den Video Çek
                </h2>
                <p className="text-xs text-slate-400">
                  Sotwe veya Twitter'dan herhangi bir tweet URL'sini yapıştırın. Sunucu HD video URL'sini otomatik bulur.
                </p>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <Smartphone className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">📱 Mobilden Nasıl Kullanılır?</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Sotwe'de bir video postuna tıkla</li>
                    <li>Adres çubuğundaki URL'yi kopyala</li>
                    <li>Aşağıya yapıştır ve "Video Çek" butonuna bas</li>
                    <li>Otomatik eklenir! 🎉</li>
                  </ol>
                  <p className="mt-2 text-slate-500 text-[10px]">Desteklenen: sotwe.com • twitter.com • x.com • vxtwitter.com</p>
                </div>
              </div>

              {/* URL Input */}
              <form onSubmit={handleTweetUrlImport} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tweetUrl}
                    onChange={(e) => { setTweetUrl(e.target.value); setTweetResult(null); setTweetError(""); }}
                    placeholder="https://www.sotwe.com/AbbeyVelvett/status/1234567890"
                    className="w-full px-4 py-3.5 rounded-xl bg-black border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white font-mono"
                    disabled={tweetImporting}
                  />
                  {tweetUrl && (
                    <button
                      type="button"
                      onClick={() => { setTweetUrl(""); setTweetResult(null); setTweetError(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={tweetImporting || !tweetUrl.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm transition-all hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  {tweetImporting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /><span>Çekiliyor...</span></>
                  ) : (
                    <><Download className="w-4 h-4" /><span>Video Çek</span></>
                  )}
                </button>
              </form>

              {/* Error */}
              {tweetError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{tweetError}</span>
                </div>
              )}

              {/* Success Preview */}
              {tweetResult?.post && (
                <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Video bulundu! Siteye eklemek için onayla.</span>
                  </div>

                  {/* Video preview */}
                  {tweetResult.post.media?.[0]?.type === "video" && (
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-xs">
                      <video
                        src={tweetResult.post.media[0].url}
                        controls
                        muted
                        playsInline
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-white">@{tweetResult.author || tweetResult.post.userId}</p>
                    <p className="line-clamp-2">{tweetResult.post.content}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleTweetResultApply}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Siteye Ekle
                    </button>
                    <button
                      onClick={() => { setTweetResult(null); setTweetUrl(""); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-slate-300 font-semibold text-sm hover:text-white transition-all cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
