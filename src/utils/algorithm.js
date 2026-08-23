/**
 * TikTok / Instagram Reels "For You" (Keşfet) & Discovery Algorithm
 * 
 * Kararlı (Deterministic) & Kesintisiz Çeşitlilik Motoru:
 * 1. Aynı kullanıcının üst üste gelmesini engeller (Round-Robin Creator Interleaving).
 * 2. Kararlıdır (Stable): Sayfa kaydırılırken sıra rastgele bozulmaz, video atlama yapmaz.
 * 3. Her içerik üreticisinden sırayla 1'er video alarak zengin bir akış sunar.
 */

export function buildForYouFeed(posts) {
  if (!posts || posts.length <= 2) return posts || [];

  // 1. Gönderileri kullanıcılara göre kararlı bir şekilde grupla
  const userGroups = {};
  const userOrder = [];

  posts.forEach((p) => {
    const uid = p.userId || "anonymous";
    if (!userGroups[uid]) {
      userGroups[uid] = [];
      userOrder.push(uid);
    }
    userGroups[uid].push(p);
  });

  if (userOrder.length <= 1) return posts;

  // 2. Kararlı Round-Robin Harmana Dönüştür
  const result = [];
  let maxPerUser = 0;
  for (const uid of userOrder) {
    if (userGroups[uid].length > maxPerUser) {
      maxPerUser = userGroups[uid].length;
    }
  }

  for (let round = 0; round < maxPerUser; round++) {
    for (const uid of userOrder) {
      if (round < userGroups[uid].length) {
        result.push(userGroups[uid][round]);
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
