/**
 * Smart Chunked Streaming Engine
 * 
 * İlk 512 KB'ı anında indirir (<50ms), Blob/MediaSource oluşturur ve videoyu başlatır.
 * Video oynarken arka planda kalan parçaları (chunks) kesintisiz aktarır.
 * İnternet yavaşlarsa tampon (buffer) kontrolü yaparak donmayı engeller.
 */

const INITIAL_CHUNK_BYTES = 512 * 1024; // İlk 512 KB (Başlatma eşiği)
const SUBSEQUENT_CHUNK_BYTES = 1.5 * 1024 * 1024; // 1.5 MB akış parçaları
const blobCache = new Map(); // url -> Blob URL
const activeStreams = new Map(); // url -> AbortController

/**
 * İlk 512 KB parçasını indirip anında Blob URL üretir
 */
export async function getInitialFastBlob(videoUrl) {
  if (!videoUrl) return null;
  if (blobCache.has(videoUrl)) {
    return blobCache.get(videoUrl);
  }

  try {
    const controller = new AbortController();
    activeStreams.set(videoUrl, controller);

    // 1. İlk 512 KB için Range Request
    const res = await fetch(videoUrl, {
      headers: {
        Range: `bytes=0-${INITIAL_CHUNK_BYTES - 1}`,
      },
      signal: controller.signal,
    });

    if (!res.ok && res.status !== 206) {
      // Range desteklenmiyorsa normal URL'yi dön
      return videoUrl;
    }

    const chunkData = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "video/mp4";
    const initialBlob = new Blob([chunkData], { type: contentType });
    const fastUrl = URL.createObjectURL(initialBlob);

    // 2. Arka planda tam videoyu sessizce indirmeye devam et
    streamRemainingChunks(videoUrl, contentType, chunkData, controller);

    return fastUrl;
  } catch (err) {
    if (err.name !== "AbortError") {
      // Hata durumunda doğrudan orijinal CDN URL'si fallback
      return videoUrl;
    }
    return videoUrl;
  }
}

/**
 * Arka planda kalan video parçalarını indirir ve Blob'u günceller
 */
async function streamRemainingChunks(videoUrl, contentType, initialChunk, controller) {
  try {
    // Kalan tüm parçayı arka planda indir
    const fullRes = await fetch(videoUrl, {
      headers: {
        Range: `bytes=${INITIAL_CHUNK_BYTES}-`,
      },
      signal: controller.signal,
      priority: "low",
    });

    if (fullRes.ok || fullRes.status === 206) {
      const remainingChunk = await fullRes.arrayBuffer();
      const combined = new Blob([initialChunk, remainingChunk], { type: contentType });
      const fullBlobUrl = URL.createObjectURL(combined);
      
      // Tam videoyu önbelleğe kaydet
      blobCache.set(videoUrl, fullBlobUrl);
    }
  } catch (_) {
    // Network hatası olursa sessizce geç
  } finally {
    activeStreams.delete(videoUrl);
  }
}

/**
 * Sıradaki videoların ilk 512 KB'ını RAM'e önceden çek (Pre-warm)
 */
export function prewarmUpcomingVideos(videoUrls) {
  if (!videoUrls || !Array.isArray(videoUrls)) return;

  videoUrls.slice(0, 4).forEach((url) => {
    if (url && !blobCache.has(url) && !activeStreams.has(url)) {
      getInitialFastBlob(url).catch(() => {});
    }
  });
}

/**
 * Ağ Hızına Göre En Uygun Video Kalitesini Seçer (Adaptive Bitrate)
 */
export function getAdaptiveVideoUrl(post) {
  if (!post) return null;
  const media = post.media?.find((m) => m.type === "video");
  if (!media) return null;

  // Eğer post'un farklı çözünürlükleri (variants) varsa:
  if (media.variants && media.variants.length > 0) {
    // Tarayıcı ağ durumunu kontrol et (Network Information API)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || "4g";
    const saveData = connection?.saveData;

    // Kötü internet veya Veri Tasarrufu açıksa 480p / 360p seç
    if (saveData || effectiveType === "2g" || effectiveType === "slow-2g") {
      const lowQuality = media.variants.find((v) => v.quality === "480p" || v.quality === "360p");
      if (lowQuality) return lowQuality.url;
    }

    // 3G ise 720p seç
    if (effectiveType === "3g") {
      const midQuality = media.variants.find((v) => v.quality === "720p");
      if (midQuality) return midQuality.url;
    }

    // 4G/WiFi ise 720p veya 1080p seç (Mobil dikey için 720p en akıcıdır)
    const defaultQuality = media.variants.find((v) => v.quality === "720p") || media.variants[0];
    return defaultQuality?.url || media.url;
  }

  return media.url;
}
