"""
WOLLY PRE-RANKING ENGINE v1.0
Supabase'deki tum videolara puan hesaplayip yazar.
Scraper her calistiginda otomatik tetiklenir.

Puanlama Faktorleri:
  1. Profil Populerligi  (takipci sayisi)        -> Agirlik: 30%
  2. Icerik Tazeligi     (ne kadar yeni?)         -> Agirlik: 25%
  3. Cesitlilik Skoru    (ayni profil ust uste?)  -> Agirlik: 25%
  4. Engagement Skoru    (begeni/retweet/yorum)   -> Agirlik: 20%

Formul:
  score = (pop * 0.30) + (fresh * 0.25) + (div * 0.25) + (eng * 0.20)
  Normalize edilmis -> 0.0 ... 1.0 araligi
"""

import sys
import os
import requests
import json
import math
import time
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ1OTkwNSwiZXhwIjoyMTAzMDM1OTA1fQ.H609VYClmuWrcW68OegHVdHjLun0-nNlawAymHPZayY"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# --- Veri Cekici ---

def fetch_all(table, select="*", order=None, page_size=1000):
    all_rows = []
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&limit={page_size}&offset={offset}"
        if order:
            url += f"&order={order}"
        r = requests.get(url, headers=HEADERS, timeout=30)
        try:
            rows = r.json()
        except Exception:
            break
        if not isinstance(rows, list) or len(rows) == 0:
            break
        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size
    return all_rows

# --- Normalize Yardimcilari ---

def sigmoid(x, k=1.0):
    try:
        return 1.0 / (1.0 + math.exp(-k * x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0

# --- Faktor Hesaplayicilar ---

def popularity_score(user_followers):
    if not user_followers or user_followers <= 0:
        return 0.1
    return min(math.log10(user_followers + 1) / 7.0, 1.0)

def freshness_score(inserted_at_str):
    try:
        if not inserted_at_str:
            return 0.3
        dt = datetime.fromisoformat(inserted_at_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        age_hours = max(0.1, (now - dt).total_seconds() / 3600)
        decay = math.exp(-age_hours / 168)
        return max(0.05, decay)
    except Exception:
        return 0.3

def engagement_score(stats):
    if not stats or not isinstance(stats, dict):
        return 0.1
    raw = (
        stats.get("likes", 0) * 1.0 +
        stats.get("retweets", 0) * 2.0 +
        stats.get("replies", 0) * 1.5 +
        stats.get("bookmarks", 0) * 0.5
    )
    return sigmoid(raw / 1000.0 - 3.0, k=1.5)

def diversity_score(post_index):
    return 1.0 / (1.0 + math.log(post_index + 1) * 0.7)

# --- Ana Ranking Fonksiyonu ---

def compute_scores(posts, users):
    print(f"[*] Toplam {len(posts)} video icin on-siralama puani hesaplaniyor...")

    user_map = {u["id"]: u for u in users}
    user_video_idx = {}

    scored = []
    for post in posts:
        uid = post.get("user_id", "")
        user = user_map.get(uid, {})

        user_video_idx[uid] = user_video_idx.get(uid, 0) + 1
        v_idx = user_video_idx[uid] - 1

        pop   = popularity_score(user.get("followers", 1000))
        fresh = freshness_score(post.get("inserted_at"))
        eng   = engagement_score(post.get("stats") or {})
        div   = diversity_score(v_idx)

        final = (pop * 0.30) + (fresh * 0.25) + (div * 0.25) + (eng * 0.20)

        scored.append({
            "id": post["id"],
            "score": round(final, 6),
            "_debug": {
                "pop": round(pop, 3),
                "fresh": round(fresh, 3),
                "eng": round(eng, 3),
                "div": round(div, 3),
            }
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored

# --- Supabase'e Yaz ---

def write_scores_to_supabase(scored_posts):
    print("[*] Puanlar Supabase'e isleniyor...")
    batch_size = 50
    success_count = 0
    fail_count = 0

    for i in range(0, len(scored_posts), batch_size):
        batch = scored_posts[i:i + batch_size]
        for item in batch:
            patch_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{item['id']}"
            patch_headers = {**HEADERS, "Prefer": "return=minimal"}
            try:
                r = requests.patch(
                    patch_url,
                    headers=patch_headers,
                    json={"score": item["score"]},
                    timeout=10
                )
                if r.status_code in [200, 204]:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception:
                fail_count += 1

        print(f"    [{min(i + batch_size, len(scored_posts))}/{len(scored_posts)}] tamamlandi...")

    print(f"[+] {success_count} video basariyla puanlandi!")
    if fail_count > 0:
        print(f"[!] {fail_count} videoda guncelleme atlandi (kolon henuz olusmamis olabilir).")

# --- Ana Giris ---

def run_ranking_engine(verbose=True):
    print("\n" + "="*60)
    print("  [WOLLY RANKING ENGINE] Pre-Ranking Baslatildi")
    print("="*60)
    start = time.time()

    posts = fetch_all("posts", select="id,user_id,stats,inserted_at")
    users = fetch_all("users", select="id,followers,posts_count")
    print(f"[+] {len(posts)} video, {len(users)} profil veritabanindan okundu.")

    if not posts:
        print("[-] Veritabaninda video bulunamadi.")
        return

    scored = compute_scores(posts, users)

    if verbose and len(scored) > 0:
        print("\n[📊] Ilk 10 Video (Siralama Onizleme):")
        print("-" * 55)
        for i, s in enumerate(scored[:10]):
            d = s["_debug"]
            print(f"  #{i+1:2d}  ID: {s['id'][:35]:35s} | Skor: {s['score']:.4f}")
        print("-" * 55)

    write_scores_to_supabase(scored)

    elapsed = time.time() - start
    print(f"[+] Siralama tamamlandi! Toplam sure: {elapsed:.1f} sn")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_ranking_engine(verbose=True)
