"""
Sotwe One-Click Profile Scraper & Auto-Deploy CLI
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
from playwright.async_api import async_playwright

def extract_handle(input_str):
    clean = input_str.strip()
    clean = re.sub(r'https?://(www\.)?sotwe\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?twitter\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?x\.com/', '', clean, flags=re.I)
    clean = clean.lstrip('@')
    clean = re.split(r'[?#/]', clean)[0]
    return clean.strip()

def run_git_push(username, video_count):
    print("\n" + "="*50)
    print("[*] Otomatik GitHub Push Başlatılıyor...")
    print("="*50)
    
    try:
        # 1. git add
        subprocess.run(["git", "add", "-A"], check=True)
        print("[+] 'git add -A' tamamlandı.")
        
        # 2. git commit
        commit_msg = f"feat(scraper): @{username} profilinden {video_count} video eklendi [auto-deploy]"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        print(f"[+] 'git commit' tamamlandı: {commit_msg}")
        
        # 3. git push
        subprocess.run(["git", "push"], check=True)
        print("[+] 'git push' başarıyla tamamlandı! 🚀")
        print("[🎉] Vercel deploy otomatik başladı. Site 1-2 dakika içinde güncellenecektir!")
    except subprocess.CalledProcessError as e:
        print(f"[-] Git hatası: {e}")
    except Exception as e:
        print(f"[-] Beklenmeyen hata: {e}")

async def scrape_profile(username):
    url = f"https://www.sotwe.com/{username}?lang=tr"
    print(f"\n[*] Sotwe profili taranıyor: @{username}")
    print(f"[*] Hedef URL: {url}")
    print("[*] Chrome tarayıcı açılıyor (Cloudflare korumasını geçmek için)...")
    
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
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"[-] Sayfa yükleme uyarısı: {e}")
            
        print("[*] Sayfa açıldı. Cloudflare doğrulanıyor ve içerik bekleniyor...")
        await asyncio.sleep(5)
        
        # Scroll down to load videos
        print("[*] Sayfa aşağı kaydırılarak tüm HD videolar yükleniyor...")
        for i in range(12):
            await page.evaluate("window.scrollBy(0, 2000)")
            print(f"    -> Kaydırma {i+1}/12...")
            await asyncio.sleep(1.2)
            
        html = await page.content()
        await browser.close()
        print("[+] Tarayıcı kapatıldı.")
        
        # Extract MP4s
        mp4_regex = r'https://[^\s"\'\\]+\.mp4[^\s"\'\\]*'
        raw_matches = re.findall(mp4_regex, html)
        clean_mp4s = []
        seen = set()
        for m in raw_matches:
            v_url = m.replace('\\u0026', '&').replace('\\', '')
            if ('video-s.twimg.com' in v_url or 'video.twimg.com' in v_url or '.mp4' in v_url) and v_url not in seen:
                seen.add(v_url)
                clean_mp4s.append(v_url)
                
        print(f"\n[+] Toplam {len(clean_mp4s)} adet HD MP4 video bulundu!")
        
        if len(clean_mp4s) == 0:
            print("[-] Bu profilde video bulunamadı veya sayfa henüz yüklenmedi.")
            return
            
        now_ts = int(time.time())
        posts = []
        for idx, mp4 in enumerate(clean_mp4s):
            posts.append({
                "id": f"{username}_{idx+1}_{now_ts}",
                "userId": username,
                "content": f"@{username} Video #{idx+1}",
                "createdAt": "Yeni",
                "mediaType": "video",
                "media": [{
                    "type": "video",
                    "url": mp4,
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
        
        # Update mockData.js
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
                
            print(f"[+] mockData.js güncellendi! Toplam video sayısı: {len(merged_posts)}")
            
            # Otomatik Git Push & Deploy
            run_git_push(username, len(posts))

def main():
    print("\n" + "="*50)
    print(" 🎬 WOLLY SOTWE OTOMATIK VIDEO CEKICI & DEPLOYER")
    print("="*50)
    
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
        
    asyncio.run(scrape_profile(handle))

if __name__ == "__main__":
    main()
