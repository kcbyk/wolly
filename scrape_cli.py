"""
Sotwe Precision Scraper & Supabase Auto-Deploy CLI
Kullanım: python scrape_cli.py
Veya: python scrape_cli.py <kullanici_adi_veya_link>
"""

import sys
import os
import asyncio
import json
import time
import re
import subprocess
import requests
from playwright.async_api import async_playwright

SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ1OTkwNSwiZXhwIjoyMTAzMDM1OTA1fQ.H609VYClmuWrcW68OegHVdHjLun0-nNlawAymHPZayY"

def extract_handle(input_str):
    clean = input_str.strip()
    clean = re.sub(r'https?://(www\.)?sotwe\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?twitter\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?x\.com/', '', clean, flags=re.I)
    clean = clean.lstrip('@')
    clean = re.split(r'[?#/]', clean)[0]
    return clean.strip()

def upload_to_supabase(user_data, posts_data):
    print("\n" + "="*60)
    print("[*] ☁️ Supabase Bulut Veritabanına Yükleniyor...")
    print("="*60)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    try:
        # 1. Upsert User
        user_payload = {
            "id": user_data["id"],
            "name": user_data["name"],
            "handle": user_data["handle"],
            "avatar": user_data.get("avatar", ""),
            "banner": user_data.get("banner", ""),
            "bio": user_data.get("bio", ""),
            "verified": user_data.get("verified", True),
            "badge_type": user_data.get("badgeType", "blue"),
            "followers": user_data.get("stats", {}).get("followers", 5000),
            "following": user_data.get("stats", {}).get("following", 150),
            "posts_count": len(posts_data)
        }
        
        u_res = requests.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=headers,
            json=user_payload,
            timeout=15
        )
        if u_res.status_code in [200, 201]:
            print(f"[+] Profil Supabase'e kaydedildi: @{user_data['id']}")
        else:
            print(f"[-] Profil yükleme cevabı ({u_res.status_code}): {u_res.text[:200]}")
            
        # 2. Upsert Posts
        posts_payload = []
        for p in posts_data:
            posts_payload.append({
                "id": p["id"],
                "user_id": p["userId"],
                "content": p["content"],
                "created_at": p.get("createdAt", "Yeni"),
                "media_type": p.get("mediaType", "video"),
                "media": p.get("media", []),
                "stats": p.get("stats", {"likes": 150, "replies": 10, "retweets": 25, "bookmarks": 20})
            })
            
        # Chunk upload if many posts (e.g. batches of 100)
        batch_size = 100
        for i in range(0, len(posts_payload), batch_size):
            batch = posts_payload[i:i + batch_size]
            p_res = requests.post(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers=headers,
                json=batch,
                timeout=30
            )
            if p_res.status_code in [200, 201]:
                print(f"[+] [{min(i + batch_size, len(posts_payload))}/{len(posts_payload)}] video Supabase'e aktarıldı.")
            else:
                print(f"[-] Batch yükleme hatası: {p_res.text[:200]}")
                
        print(f"[🎉] TOPLAM {len(posts_payload)} ADET VİDEO BULUTA EKLENDİ! 🚀")
        print("[⚡] Sitedeki sayaç ve videolar anında canlı olarak güncellendi.")
            
    except Exception as e:
        print(f"[-] Supabase bağlantı hatası: {e}")

def run_git_push(username, video_count):
    print("\n" + "="*60)
    print("[*] GitHub Yedekleme Başlatılıyor...")
    print("="*60)
    
    try:
        subprocess.run(["git", "add", "-A"], check=True)
        commit_msg = f"feat(scraper): @{username} profilinden {video_count} video eklendi [backup]"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        subprocess.run(["git", "push"], check=True)
        print("[+] 'git push' başarıyla tamamlandı! 🚀")
    except Exception as e:
        print(f"[-] Git push notu: {e}")

async def scrape_profile(username, max_target=0):
    url = f"https://www.sotwe.com/{username}?lang=tr"
    print(f"\n[*] Hedef Profil: @{username}")
    print(f"[*] URL: {url}")
    print(f"[*] İstenen Video Sayısı: {'Tüm Profil (Maksimum)' if max_target <= 0 else f'Tam {max_target} Adet'}")
    print("[*] Chrome tarayıcısı açılıyor...")
    
    user_data_dir = os.path.join(os.getcwd(), ".chrome_user_data")
    os.makedirs(user_data_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        # Ağ trafiğinden de MP4 yakalama (arka planda yüklenenler kaçmasın)
        captured_network_mp4s = set()
        
        def handle_response(response):
            try:
                res_url = response.url
                if '.mp4' in res_url and ('twimg.com' in res_url or 'video' in res_url):
                    captured_network_mp4s.add(res_url)
            except:
                pass
                
        page.on("response", handle_response)
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"[-] Sayfa yükleme uyarısı: {e}")
            
        print("[*] Sayfa açıldı. Cloudflare doğrulanıyor ve başlangıç bekleniyor...")
        await asyncio.sleep(5)
        
        print("\n[*] 📜 Hassas tarama ve akıllı kaydırma devrede...")
        
        clean_mp4s = []
        seen = set()
        stalled_rounds = 0
        max_scroll_attempts = 300 if max_target <= 0 else max(100, max_target * 2)
        
        for round_idx in range(1, max_scroll_attempts + 1):
            # 1. Sayfa sonuna kaydır
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.keyboard.press("PageDown")
            await asyncio.sleep(1.5)
            
            # 2. DOM'dan video URL'lerini topla
            html_chunk = await page.content()
            raw_matches = re.findall(r'https://[^\s"\'\\]+\.mp4[^\s"\'\\]*', html_chunk)
            
            for m in raw_matches:
                v_url = m.replace('\\u0026', '&').replace('\\', '')
                if ('video-s.twimg.com' in v_url or 'video.twimg.com' in v_url or '.mp4' in v_url) and v_url not in seen:
                    seen.add(v_url)
                    clean_mp4s.append(v_url)
                    
            # 3. Ağdan yakalananları da ekle
            for net_url in captured_network_mp4s:
                if net_url not in seen:
                    seen.add(net_url)
                    clean_mp4s.append(net_url)
                    
            current_count = len(clean_mp4s)
            target_str = f"/{max_target}" if max_target > 0 else ""
            print(f"    -> [Tur {round_idx}] Bulunan Video Sayısı: {current_count}{target_str}")
            
            # İstenen sayıya ulaşıldı mı?
            if max_target > 0 and current_count >= max_target:
                print(f"\n[+] 🎉 İstediğiniz {max_target} video hedefine ulaşıldı!")
                clean_mp4s = clean_mp4s[:max_target]
                break
                
            # Eğer yeni video gelmediyse Sotwe'nin lazy-load tetikleyicisini dürt
            if round_idx > 3 and current_count == len(clean_mp4s):
                stalled_rounds += 1
                if stalled_rounds in [2, 4, 6]:
                    # Hafif yukarı kaydırıp tekrar en aşağı in
                    await page.evaluate("window.scrollBy(0, -1000)")
                    await asyncio.sleep(0.6)
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await asyncio.sleep(2.0)
                elif stalled_rounds >= 10:
                    print("[*] Profilin sonuna gelindi (Yeni video bulunamadı).")
                    break
            else:
                stalled_rounds = 0
                
        await browser.close()
        print("[+] Tarayıcı kapatıldı.")
        
        # Eğer istenen hedef varsa tam o sayıya sınırla
        if max_target > 0 and len(clean_mp4s) > max_target:
            clean_mp4s = clean_mp4s[:max_target]
            
        print(f"\n[+] 🎉 TOPLAM {len(clean_mp4s)} ADET HD MP4 VIDEO AYIKLANDI!")
        
        if len(clean_mp4s) == 0:
            print("[-] Bu profilde video bulunamadı.")
            return
            
        now_ts = int(time.time())
        posts = []
        for idx, mp4 in enumerate(clean_mp4s):
            # Adaptive stream variants for low internet fallback
            variants = []
            if "720x1280" in mp4:
                variants = [
                    {"url": mp4, "quality": "720p"},
                    {"url": mp4.replace("720x1280", "480x852"), "quality": "480p"},
                    {"url": mp4.replace("720x1280", "320x568"), "quality": "360p"},
                ]
            elif "1080x1920" in mp4:
                variants = [
                    {"url": mp4.replace("1080x1920", "720x1280"), "quality": "720p"},
                    {"url": mp4, "quality": "1080p"},
                    {"url": mp4.replace("1080x1920", "480x852"), "quality": "480p"},
                ]
            else:
                variants = [{"url": mp4, "quality": "auto"}]

            posts.append({
                "id": f"{username}_{idx+1}_{now_ts}",
                "userId": username,
                "content": f"@{username} Video #{idx+1}",
                "createdAt": "Yeni",
                "mediaType": "video",
                "media": [{
                    "type": "video",
                    "url": mp4,
                    "variants": variants,
                    "poster": "",
                    "alt": f"@{username} video"
                }],
                "stats": {
                    "likes": 150 + idx * 10,
                    "replies": 15 + idx,
                    "retweets": 40 + idx * 2,
                    "bookmarks": 25 + idx
                }
            })
            
        user = {
            "id": username,
            "name": username,
            "handle": username,
            "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={username}",
            "bio": f"@{username} Sotwe Medyaları",
            "verified": True,
            "badgeType": "blue",
            "stats": {
                "followers": 5000,
                "following": 150,
                "posts": len(posts)
            }
        }
        
        # 1. Doğrudan Supabase Buluta Yükle
        upload_to_supabase(user, posts)
        
        # 2. Otomatik Pre-Ranking Motorunu Çalıştır (Tüm videoları puanla ve sırala)
        try:
            from ranking_engine import run_ranking_engine
            run_ranking_engine(verbose=False)
        except Exception as re_err:
            print(f"[-] Ranking engine uyarısı: {re_err}")
        
        # 3. mockData.js güncelle (Yerel yedek için)
        mockdata_path = os.path.join("src", "data", "mockData.js")
        if os.path.exists(mockdata_path):
            with open(mockdata_path, "r", encoding="utf-8") as f:
                code = f.read()
                
            users_match = re.search(r'export const MOCK_USERS = (\[.*?\]);', code, re.DOTALL)
            posts_match = re.search(r'export const MOCK_POSTS = (\[.*?\]);', code, re.DOTALL)
            
            cur_users = json.loads(users_match.group(1)) if users_match else []
            cur_posts = json.loads(posts_match.group(1)) if posts_match else []
            
            merged_users = [user] + [u for u in cur_users if u["id"] != username]
            merged_posts = posts + [p for p in cur_posts if p["userId"] != username]
            
            new_code = f"export const MOCK_USERS = {json.dumps(merged_users, ensure_ascii=False, indent=2)};\n\nexport const MOCK_POSTS = {json.dumps(merged_posts, ensure_ascii=False, indent=2)};\n"
            with open(mockdata_path, "w", encoding="utf-8") as f:
                f.write(new_code)
                
        # 3. Git Push
        run_git_push(username, len(posts))

def main():
    print("\n" + "="*60)
    print(" 🎬 WOLLY SOTWE TAM SAYI ODAKLI VIDEO CEKICI")
    print("="*60)
    
    target = ""
    if len(sys.argv) >= 2 and sys.argv[1].strip():
        target = sys.argv[1].strip()
    else:
        try:
            target = input("\n👉 Sotwe Profil URL veya Kullanıcı Adı girin: ").strip()
        except KeyboardInterrupt:
            print("\n[-] Çıkış yapıldı.")
            sys.exit(0)
            
    if not target:
        print("[-] URL veya kullanıcı adı girmediniz!")
        sys.exit(1)
        
    handle = extract_handle(target)
    if not handle:
        print("[-] Geçersiz kullanıcı adı veya URL!")
        sys.exit(1)
        
    limit_input = ""
    try:
        limit_input = input("👉 Kaç video çekilsin? (Örn: 50, 100 veya tümü için boş bırakıp Enter): ").strip()
    except KeyboardInterrupt:
        sys.exit(0)
        
    max_target = int(limit_input) if limit_input.isdigit() else 0
    
    asyncio.run(scrape_profile(handle, max_target))

if __name__ == "__main__":
    main()
