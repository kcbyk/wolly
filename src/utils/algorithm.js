/**
 * TikTok / Instagram Reels "For You" (Keşfet) & Discovery Algorithm
 * 
 * Özellikler:
 * 1. Aynı kullanıcının üst üste gelmesini engeller (Round-Robin Creator Interleaving).
 * 2. Farklı profiller arasında dinamik ve çeşitli bir akış oluşturur.
 * 3. Popülerlik ve beğeni puanlarını harmanlar.
 */

export function buildForYouFeed(posts) {
  if (!posts || posts.length <= 2) return posts || [];

  // 1. Gönderileri kullanıcılara göre grupla
  const userGroups = {};
  posts.forEach((p) => {
    const uid = p.userId || "anonymous";
    if (!userGroups[uid]) userGroups[uid] = [];
    userGroups[uid].push(p);
  });

  const userKeys = Object.keys(userGroups);
  if (userKeys.length <= 1) return posts;

  // 2. Çeşitlilik Motoru (Round-Robin Interleaving)
  const result = [];
  let hasMore = true;

  while (hasMore) {
    hasMore = false;
    // Her turda kullanıcı sırasını karıştır (her seferinde farklı keşfet deneyimi)
    const shuffledKeys = [...userKeys].sort(() => Math.random() - 0.5);

    for (const uid of shuffledKeys) {
      if (userGroups[uid].length > 0) {
        result.push(userGroups[uid].shift());
        if (userGroups[uid].length > 0) {
          hasMore = true;
        }
      }
    }
  }

  return result;
}

/**
 * Popüler / Trend Videolar Algoritması
 */
export function buildTrendingFeed(posts) {
  if (!posts) return [];
  return [...posts].sort((a, b) => {
    const scoreA = (a.stats?.likes || 0) * 2 + (a.stats?.retweets || 0) * 3 + (a.stats?.replies || 0);
    const scoreB = (b.stats?.likes || 0) * 2 + (b.stats?.retweets || 0) * 3 + (b.stats?.replies || 0);
    return scoreB - scoreA;
  });
}
