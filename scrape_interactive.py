import json
import asyncio
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

from playwright.async_api import async_playwright

async def main():
    user_data_dir = os.path.join(os.environ.get("TEMP", "C:/Temp"), "chrome_sotwe_session")
    os.makedirs(user_data_dir, exist_ok=True)
    
    async with async_playwright() as p:
        print("Launching Chrome with persistent context...")
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            channel="chrome",
            headless=False,
            viewport={"width": 1280, "height": 800},
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if context.pages else await context.new_page()

        api_results = []
        async def on_resp(res):
            url = res.url
            if ("api" in url or "user" in url) and not url.endswith((".js", ".css", ".png", ".jpg", ".wasm", ".svg")):
                try:
                    if "json" in res.headers.get("content-type", ""):
                        data = await res.json()
                        api_results.append({"url": res.url, "data": data})
                        print(f"Captured Sotwe API: {res.url}")
                except Exception:
                    pass

        page.on("response", on_resp)

        target = "https://www.sotwe.com/ardakara222?lang=tr"
        print(f"Navigating to {target}...")
        await page.goto(target)

        for attempt in range(40):
            title = await page.title()
            print(f"Waiting [{attempt+1}s] - Title: {title}")
            if "Bir dakika" not in title and "Just a moment" not in title and "Checking" not in title and "www.sotwe.com" not in title:
                print("SUCCESS: Sotwe profile loaded!")
                break
            await page.wait_for_timeout(1000)

        # Wait for data load and scroll down to load videos
        print("Scrolling page to load all posts and videos...")
        await page.wait_for_timeout(4000)
        for i in range(12):
            await page.evaluate("window.scrollBy(0, 1000)")
            await page.wait_for_timeout(1500)

        # Save HTML
        html_text = await page.content()
        with open("ardakara_full_page.html", "w", encoding="utf-8") as f:
            f.write(html_text)

        # Extract structured data from DOM & Vue/Nuxt state
        extracted = await page.evaluate('''() => {
            const data = {
                user: {
                    id: "ardakara222",
                    name: "Arda Kara",
                    handle: "ardakara222",
                    avatar: "",
                    banner: "",
                    bio: "",
                    verified: false,
                    following: 0,
                    followers: 0,
                    postsCount: 0
                },
                posts: []
            };

            // Avatar
            const avatar = document.querySelector('img[src*="profile_images"], img[src*="avatar"], .user-avatar img');
            if (avatar) data.user.avatar = avatar.src;

            // Banner
            const banner = document.querySelector('img[src*="profile_banners"], .user-banner img, .header-banner img');
            if (banner) data.user.banner = banner.src;

            // Name
            const nameEl = document.querySelector('h1, h2, .profile-name, [class*="fullname"], [class*="user-name"]');
            if (nameEl) data.user.name = nameEl.innerText.trim();

            const bioEl = document.querySelector('.profile-bio, [class*="bio"], [class*="description"]');
            if (bioEl) data.user.bio = bioEl.innerText.trim();

            // Find all cards
            const articles = document.querySelectorAll('article, [class*="post-card"], [class*="tweet"], [class*="media-card"], div[class*="post"]');
            articles.forEach((el, idx) => {
                const textEl = el.querySelector('p, [class*="text"], [class*="content"]');
                const text = textEl ? textEl.innerText.trim() : (el.innerText ? el.innerText.slice(0, 200).trim() : "");
                
                // Videos
                const videos = Array.from(el.querySelectorAll('video')).map(v => ({
                    src: v.src || v.querySelector('source')?.src || "",
                    poster: v.poster || ""
                })).filter(v => v.src);

                // Images
                const images = Array.from(el.querySelectorAll('img')).map(img => img.src)
                    .filter(src => src && !src.includes('profile_images') && !src.includes('avatar') && !src.includes('data:'));

                if (videos.length > 0 || images.length > 0) {
                    data.posts.push({
                        id: "post-" + idx,
                        text: text,
                        videos: videos,
                        images: images
                    });
                }
            });

            // Global video fallback
            document.querySelectorAll('video').forEach((v, idx) => {
                const src = v.src || v.querySelector('source')?.src;
                const poster = v.poster || "";
                if (src && !data.posts.some(p => p.videos && p.videos.some(vid => vid.src === src))) {
                    data.posts.push({
                        id: "video-global-" + idx,
                        text: "Video Gönderisi",
                        videos: [{ src: src, poster: poster }],
                        images: []
                    });
                }
            });

            return data;
        }''')

        print(f"Scraped User: {extracted['user']}")
        print(f"Scraped Posts count: {len(extracted['posts'])}")

        with open("ardakara_scraped.json", "w", encoding="utf-8") as f:
            json.dump(extracted, f, ensure_ascii=False, indent=2)

        if api_results:
            with open("ardakara_api_full.json", "w", encoding="utf-8") as f:
                json.dump(api_results, f, ensure_ascii=False, indent=2)

        await context.close()
        print("DONE!")

if __name__ == "__main__":
    asyncio.run(main())
