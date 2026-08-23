/**
 * Vercel Serverless Function: /api/tweet
 * Tweet URL'sinden fxtwitter API kullanarak HD video URL'si çeker.
 * Ücretsiz, bot koruması yok, mobil uyumlu.
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // URL veya tweet ID al
  const rawInput = req.query.url || req.query.id || (req.body && (req.body.url || req.body.id)) || "";
  if (!rawInput) {
    return res.status(400).json({ success: false, error: "url veya id parametresi eksik." });
  }

  // Tweet ID'sini çıkar
  // Desteklenen formatlar:
  //   https://twitter.com/user/status/1234567890
  //   https://x.com/user/status/1234567890
  //   https://www.sotwe.com/user/status/1234567890
  //   https://vxtwitter.com/user/status/1234567890
  //   1234567890 (direkt ID)
  let tweetId = null;
  let username = null;

  const statusMatch = rawInput.match(/(?:twitter\.com|x\.com|sotwe\.com|vxtwitter\.com|fxtwitter\.com)\/([^/?#]+)\/status\/(\d+)/i);
  if (statusMatch) {
    username = statusMatch[1];
    tweetId = statusMatch[2];
  } else if (/^\d{15,20}$/.test(rawInput.trim())) {
    tweetId = rawInput.trim();
  }

  if (!tweetId) {
    return res.status(400).json({
      success: false,
      error: "Geçersiz tweet URL'si. Örnek: https://twitter.com/kullanici/status/123456789"
    });
  }

  // fxtwitter'dan veri çek
  const fxUrl = username
    ? `https://api.fxtwitter.com/${username}/status/${tweetId}`
    : `https://api.fxtwitter.com/i/status/${tweetId}`;

  try {
    const fxRes = await fetch(fxUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });

    if (!fxRes.ok) {
      return res.status(404).json({
        success: false,
        error: `Tweet bulunamadı (${fxRes.status}). URL'yi kontrol edin.`
      });
    }

    const fxData = await fxRes.json();
    const tweet = fxData.tweet;

    if (!tweet) {
      return res.status(404).json({ success: false, error: "Tweet verisi alınamadı." });
    }

    const media = tweet.media || {};
    const videos = media.videos || [];
    const photos = media.photos || [];

    if (videos.length === 0 && photos.length === 0) {
      return res.status(200).json({
        success: false,
        error: "Bu tweet'te video veya fotoğraf bulunamadı.",
        tweet: {
          id: tweet.id,
          text: tweet.text,
          author: tweet.author?.screen_name || username
        }
      });
    }

    // Video varsa en yüksek kaliteyi al
    let bestVideoUrl = null;
    let thumbnailUrl = null;

    if (videos.length > 0) {
      // fxtwitter zaten en yüksek kaliteyi birinci sırada verir
      bestVideoUrl = videos[0].url;
      thumbnailUrl = videos[0].thumbnail_url || tweet.thumbnail_url || "";
    }

    // Yazar bilgisi
    const author = tweet.author || {};
    const authorUsername = author.screen_name || username || "unknown";
    const authorName = author.name || authorUsername;
    const authorAvatar = author.avatar_url || `https://unavatar.io/twitter/${authorUsername}`;

    // Post objesi oluştur (mockData formatında)
    const post = {
      id: tweet.id,
      userId: authorUsername,
      content: tweet.text || `@${authorUsername} videosu`,
      createdAt: tweet.created_at
        ? new Date(tweet.created_at).toLocaleDateString("tr-TR")
        : new Date().toLocaleDateString("tr-TR"),
      mediaType: videos.length > 0 ? "video" : "image",
      media: videos.length > 0
        ? [{
            type: "video",
            url: bestVideoUrl,
            poster: thumbnailUrl,
            alt: tweet.text || "Video"
          }]
        : photos.map(p => ({
            type: "image",
            url: p.url,
            alt: tweet.text || "Fotoğraf"
          })),
      stats: {
        likes: tweet.likes || 0,
        replies: tweet.replies || 0,
        retweets: tweet.retweets || 0,
        bookmarks: tweet.bookmarks || 0
      },
      user: {
        id: authorUsername,
        name: authorName,
        handle: authorUsername,
        avatar: authorAvatar,
        verified: !!author.verified,
        badgeType: author.verified ? "blue" : "none"
      }
    };

    return res.status(200).json({
      success: true,
      post,
      hasVideo: videos.length > 0,
      videoUrl: bestVideoUrl,
      tweetId: tweet.id,
      author: authorUsername
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Sunucu hatası."
    });
  }
}
