import React, { useState } from "react";
import { X, Image, Video, Sparkles, Plus, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";

const SAMPLE_MEDIA_PRESETS = [
  { name: "Neon Cyberpunk", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80", type: "image" },
  { name: "Alps Mountains", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80", type: "image" },
  { name: "Tokyo Night", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80", type: "image" },
  { name: "Sample HD Video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "video" }
];

export default function CreatePostModal() {
  const { isCreatePostOpen, setIsCreatePostOpen, addPost } = useApp();
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrls, setMediaUrls] = useState([""]);

  if (!isCreatePostOpen) return null;

  const handleAddMediaUrl = () => {
    if (mediaUrls.length < 4) {
      setMediaUrls([...mediaUrls, ""]);
    }
  };

  const handleMediaUrlChange = (index, val) => {
    const next = [...mediaUrls];
    next[index] = val;
    setMediaUrls(next);
  };

  const handleRemoveMediaUrl = (index) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (preset) => {
    setMediaType(preset.type);
    setMediaUrls([preset.url]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const validUrls = mediaUrls.filter((u) => u.trim().length > 0);
    const finalMediaType = validUrls.length > 0 ? (mediaType === "video" ? "video" : validUrls.length > 1 ? "gallery" : "image") : "none";

    addPost({
      content,
      mediaType: finalMediaType,
      mediaUrls: validUrls
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={() => setIsCreatePostOpen(false)}
    >
      <div 
        className="glass-modal w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto text-slate-100 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-200" />
            <h3 className="font-bold text-white text-base">Yeni Gönderi Oluştur</h3>
          </div>
          <button
            onClick={() => setIsCreatePostOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gönderi Metni
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Neler oluyor? @kullanıcılar ekleyebilirsiniz..."
              className="w-full p-3.5 rounded-2xl bg-[#1c1c1c] border border-white/10 focus:border-white/30 focus:outline-none text-sm text-slate-100 placeholder-slate-500 resize-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Medya Türü
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaType("image")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  mediaType === "image"
                    ? "bg-[#212121] border-white/30 text-white shadow-md"
                    : "border-white/10 text-slate-400 hover:border-white/20 bg-[#141414]"
                }`}
              >
                <Image className="w-4 h-4" /> Görsel / Galeri
              </button>

              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  mediaType === "video"
                    ? "bg-[#212121] border-white/30 text-white shadow-md"
                    : "border-white/10 text-slate-400 hover:border-white/20 bg-[#141414]"
                }`}
              >
                <Video className="w-4 h-4" /> Video (MP4)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {mediaType === "video" ? "Video URL (MP4)" : "Görsel URL(leri)"}
              </label>
              {mediaType === "image" && mediaUrls.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  className="text-xs text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Görsel Ekle
                </button>
              )}
            </div>

            {mediaUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleMediaUrlChange(idx, e.target.value)}
                  placeholder={`https://... (${idx + 1}. medya linki)`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/30"
                />
                {mediaUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMediaUrl(idx)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">Hızlı Örnek Medyalar:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_MEDIA_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-[#212121] hover:bg-[#2d2d2d] text-slate-300 text-[11px] border border-white/10 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreatePostOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-6 py-2.5 rounded-full bg-[#212121] hover:bg-[#2c2c2c] disabled:opacity-40 text-white font-bold text-xs shadow-lg border border-white/20 transition-all"
            >
              Paylaş
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
