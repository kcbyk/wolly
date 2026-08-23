import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Download } from "lucide-react";
import { downloadMedia } from "../utils/formatters";
import { useApp } from "../context/AppContext";

export default function VideoPlayer({ url, poster, onExpand, post }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { showToast } = useApp();

  const formatTime = (secs) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Track fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const togglePlay = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    const el = wrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // Enter fullscreen
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (videoRef.current?.webkitEnterFullscreen) {
        // iOS Safari fallback — directly on <video>
        videoRef.current.webkitEnterFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    const total = video.duration;
    if (total && isFinite(total)) {
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration)) {
      setDuration(formatTime(video.duration));
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    showToast("Video indiriliyor...", "info");
    await downloadMedia(url, `sotwe-video-${Date.now()}.mp4`);
    showToast("Video başarıyla indirildi! 📥");
  };

  return (
    <div
      ref={wrapperRef}
      className="relative group rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center cursor-pointer shadow-inner border border-white/10"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        referrerPolicy="no-referrer"
        disableRemotePlayback
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain"
      />

      {/* HD Badge */}
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#212121]/90 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider text-slate-200 shadow-md pointer-events-none">
        HD VIDEO
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        title="Videoyu İndir"
        className="absolute top-3 right-3 p-2 rounded-full bg-[#212121] hover:bg-[#2e2e2e] border border-white/15 text-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow-lg cursor-pointer"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* Center play button (when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-[#212121] text-white border border-white/20 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer overflow-hidden transition-all"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-1 hover:text-white transition-colors cursor-pointer">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            {/* Mute */}
            <button onClick={toggleMute} className="p-1 hover:text-white transition-colors cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            {/* Time */}
            <span className="font-mono text-[11px] text-slate-300">
              {currentTime} / {duration}
            </span>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
            className="p-1 hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
