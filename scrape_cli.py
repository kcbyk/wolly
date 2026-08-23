"""
Sotwe One-Click Profile Scraper CLI
Usage: python scrape_cli.py <username_or_url>
Example: python scrape_cli.py abbeyvelvett
"""

import sys, os, asyncio, json, time, re
from playwright.async_api import async_playwright

def extract_handle(input_str):
    clean = input_str.strip()
    clean = re.sub(r'https?://(www\.)?sotwe\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?twitter\.com/', '', clean, flags=re.I)
    clean = re.sub(r'https?://(www\.)?x\.com/', '', clean, flags=re.I)
    clean = clean.lstrip('@')
    clean = re.split(r'[?#/]', clean)[0]
    return clean.strip()

async def scrape_profile(username):
    url = f"https://www.sotwe.com/{username}?lang=tr"
    print(f"[*] Scraping Sotwe profile: @{username} ({url})")
    
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
        
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        print("[*] Waiting for content to load...")
        await asyncio.sleep(6)
        
        # Scroll down to load videos
        print("[*] Scrolling to load media...")
        for i in range(8):
            await page.evaluate("window.scrollBy(0, 1800)")
            await asyncio.sleep(1.2)
            
        html = await page.content()
        await browser.close()
        
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
                
        print(f"[+] Successfully extracted {len(clean_mp4s)} HD MP4 videos for @{username}!")
        
        if len(clean_mp4s) == 0:
            print("[-] No videos found on this profile.")
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
        mockdata_path = "src/data/mockData.js"
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
                
            print(f"[+] Added to mockData.js! Total posts now: {len(merged_posts)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scrape_cli.py <username_or_url>")
        sys.exit(1)
        
    handle = extract_handle(sys.argv[1])
    asyncio.run(scrape_profile(handle))
