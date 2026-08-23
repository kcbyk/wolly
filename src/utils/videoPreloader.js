/**
 * VideoPreloadManager
 *
 * Sıradaki videoları arka planda tarayıcı HTTP cache'ine
 * range-request ile önceden çekip belleğe kilitler.
 * Büyük veya küçük video fark etmez — play() çağrıldığında
 * tarayıcı doğrudan cache'ten okur, CDN'e gitmeye gerek kalmaz.
 */

const MAX_CONCURRENT = 2;   // Aynı anda en fazla 2 video yükle
const PREFETCH_BYTES  = 3 * 1024 * 1024; // İlk 3 MB çek (ilk saniyeler için yeterli)

class VideoPreloadManager {
  constructor() {
    this.queue   = [];   // Bekleyen URL'ler
    this.active  = new Set(); // Aktif fetch'ler
    this.cached  = new Set(); // Zaten çekilenler
  }

  /** Sıradaki N videoyu kuyruğa ekle */
  enqueue(urls) {
    for (const url of urls) {
      if (!url || this.cached.has(url) || this.active.has(url)) continue;
      if (!this.queue.includes(url)) this.queue.push(url);
    }
    this._pump();
  }

  /** İş kuyruğunu tüket */
  _pump() {
    while (this.active.size < MAX_CONCURRENT && this.queue.length > 0) {
      const url = this.queue.shift();
      this._prefetch(url);
    }
  }

  async _prefetch(url) {
    this.active.add(url);
    try {
      // Range request ile sadece ilk 3 MB'ı çek
      // Tarayıcı bunu cache'ler → video.play() anında bu cache'i bulur
      const res = await fetch(url, {
        headers: { Range: `bytes=0-${PREFETCH_BYTES - 1}` },
        priority: "low",
        cache: "force-cache",
      });
      // Body'yi consume etmeden buffer'ı boşa verme
      if (res.body) {
        const reader = res.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
      this.cached.add(url);
    } catch (_) {
      // Network hata: sessizce geç
    } finally {
      this.active.delete(url);
      this._pump();
    }
  }

  /** URL zaten cache'te mi? */
  isCached(url) {
    return this.cached.has(url);
  }
}

// Singleton — tüm uygulama paylaşır
export const videoPreloader = new VideoPreloadManager();
