import json
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        print("Launching visible Chrome to pass Cloudflare...")
        browser = await p.chromium.launch(
            channel="chrome",
            headless=False,
            args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(no_viewport=True, locale="tr-TR")
        page = await context.new_page()

        captured_api_data = []

        async def on_response(res):
            url = res.url
            if ("api" in url or "user" in url or "post" in url) and not url.endswith((".js", ".css", ".png", ".jpg", ".wasm")):
                try:
                    ct = res.headers.get("content-type", "")
                    if "json" in ct:
                        body = await res.json()
                        captured_api_data.append({"url": url, "data": body})
                        print(f"Captured API: {url}")
                except Exception:
                    pass

        page.on("response", on_response)

        target_url = "https://www.sotwe.com/ardakara222?lang=tr"
        print(f"Navigating to {target_url} ...")
        
        try:
            await page.goto(target_url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print("Goto note:", e)

        print("Waiting for page load & solving (15s)...")
        # Wait until Cloudflare is passed and title changes from 'Bir dakika lütfen...'
        for attempt in range(25):
            title = await page.title()
            print(f"[{attempt+1}] Page title: {title}")
            if "Bir dakika" not in title and "Just a moment" not in title and "Checking" not in title:
                print("Cloudflare successfully passed! 🎉")
                break
            await page.wait_for_timeout(1500)

        # Scroll multiple times to load tweets and videos
        print("Scrolling page to load media...")
        for i in range(10):
            await page.evaluate("window.scrollBy(0, 1000)")
            await page.wait_for_timeout(1500)

        # Extract comprehensive data from page DOM
        extracted_data = await page.evaluate('''() => {
            const result = {
                user: {
                    id: "ardakara222",
                    name: "Arda Kara",
                    handle: "ardakara222",
                    avatar: "",
                    banner: "",
                    bio: "",
                    verified: true,
                    followers: 0,
                    following: 0,
                    postsCount: 0
                },
                posts: []
            };

            // Avatar
            const avatarImg = document.querySelector('img[src*="profile_images"], img[src*="avatar"], .user-avatar img, .profile-avatar img');
            if (avatarImg) result.user.avatar = avatarImg.src;

            // Banner
            const bannerImg = document.querySelector('img[src*="profile_banners"], .user-banner img, .profile-banner img, [class*="banner"] img');
            if (bannerImg) result.user.banner = bannerImg.src;

            // Name & Bio
            const nameEl = document.querySelector('h1, .profile-name, [class*="username"], [class*="name"]');
            if (nameEl) result.user.name = nameEl.innerText.trim();

            const bioEl = document.querySelector('.profile-bio, [class*="bio"], [class*="description"]');
            if (bioEl) result.user.bio = bioEl.innerText.trim();

            // Find all cards / posts
            const cards = document.querySelectorAll('article, [class*="post-card"], [class*="tweet"], [class*="post"], [class*="media-card"], div[class*="item"]');
            
            cards.forEach((card, index) => {
                const textEl = card.querySelector('p, [class*="text"], [class*="content"]');
                const text = textEl ? textEl.innerText.trim() : (card.innerText ? card.innerText.slice(0, 200).trim() : "");
                
                // Videos
                const videos = Array.from(card.querySelectorAll('video')).map(v => ({
                    src: v.src || v.querySelector('source')?.src || "",
                    poster: v.poster || ""
                })).filter(v => v.src);

                // Images
                const images = Array.from(card.querySelectorAll('img')).map(img => img.src)
                    .filter(src => src && !src.includes('profile_images') && !src.includes('avatar') && !src.includes('data:'));

                if (videos.length > 0 || images.length > 0 || text.length > 5) {
                    result.posts.push({
                        index: index,
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
                if (src && !result.posts.some(p => p.videos && p.videos.some(vid => vid.src === src))) {
                    result.posts.push({
                        index: 200 + idx,
                        text: "Video Gönderisi",
                        videos: [{ src: src, poster: poster }],
                        images: []
                    });
                }
            });

            return result;
        }''')

        print(f"Extracted user: {extracted_data['user']}")
        print(f"Total raw posts found: {len(extracted_data['posts'])}")

        with open("extracted_sotwe.json", "w", encoding="utf-8") as f:
            json.dump(extracted_data, f, ensure_ascii=False, indent=2)

        if captured_api_data:
            with open("captured_api.json", "w", encoding="utf-8") as f:
                json.dump(captured_api_data, f, ensure_ascii=False, indent=2)

        await browser.close()
        print("Scraping completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
