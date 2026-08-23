import json
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        print("Starting Chrome to solve Cloudflare and scrape Sotwe...")
        browser = await p.chromium.launch(
            channel="chrome",
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--start-maximized"
            ]
        )
        context = await browser.new_context(no_viewport=True, locale="tr-TR")
        page = await context.new_page()

        captured_json_data = []

        async def on_response(res):
            url = res.url
            if ("api" in url or "user" in url or "tweet" in url or "sotwe" in url) and not url.endswith((".js", ".css", ".png", ".jpg", ".wasm", ".svg")):
                try:
                    ct = res.headers.get("content-type", "")
                    if "json" in ct:
                        body = await res.json()
                        captured_json_data.append({"url": url, "data": body})
                        print(f"--> Captured API: {url}")
                except Exception:
                    pass

        page.on("response", on_response)

        target_url = "https://www.sotwe.com/ardakara222?lang=tr"
        print(f"Navigating to {target_url} ...")
        
        try:
            await page.goto(target_url, wait_until="load", timeout=60000)
        except Exception as e:
            print("Load note:", e)

        # Loop to find & click Cloudflare checkbox if present
        print("Checking for Cloudflare Turnstile challenge...")
        for second in range(30):
            title = await page.title()
            print(f"[{second}s] Page Title: '{title}'")

            if "Bir dakika" in title or "Just a moment" in title or "Checking" in title:
                # Try clicking Turnstile iframe checkbox
                try:
                    for frame in page.frames:
                        if "cloudflare" in frame.url or "turnstile" in frame.url or "challenge" in frame.url:
                            checkbox = await frame.query_selector('input[type="checkbox"], .ctp-checkbox-label, #cf-stage')
                            if checkbox:
                                print("Found Cloudflare checkbox, clicking...")
                                await checkbox.click()
                                await page.wait_for_timeout(2000)
                except Exception as e:
                    pass
            else:
                print("Cloudflare cleared! On actual Sotwe page. 🎉")
                break
            await page.wait_for_timeout(1000)

        # Wait on actual page and scroll down to load videos
        print("Waiting 5s on page...")
        await page.wait_for_timeout(5000)

        print("Scrolling page to trigger infinite scroll for media...")
        for i in range(12):
            await page.evaluate("window.scrollBy(0, 1200)")
            await page.wait_for_timeout(1500)

        # Take screenshot of page
        await page.screenshot(path="sotwe_screenshot.png")

        # Extract comprehensive data from page DOM
        extracted_data = await page.evaluate('''() => {
            const data = {
                user: {
                    id: "ardakara222",
                    name: "",
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

            // Avatar & Banner
            const avatar = document.querySelector('img[src*="profile_images"], img[src*="avatar"], .avatar img');
            if (avatar) data.user.avatar = avatar.src;

            const banner = document.querySelector('img[src*="profile_banners"], .banner img, .header-banner img');
            if (banner) data.user.banner = banner.src;

            // Name
            const name = document.querySelector('h1, .profile-name, .user-name, [class*="fullname"]');
            if (name) data.user.name = name.innerText.trim();

            const bio = document.querySelector('.profile-bio, [class*="bio"], [class*="description"]');
            if (bio) data.user.bio = bio.innerText.trim();

            // Find all cards
            const elements = document.querySelectorAll('article, [class*="card"], [class*="post"], [class*="tweet"], [class*="media"]');
            elements.forEach((el, idx) => {
                const textEl = el.querySelector('p, [class*="text"], [class*="content"]');
                const text = textEl ? textEl.innerText.trim() : (el.innerText ? el.innerText.slice(0, 200).trim() : "");
                
                const videos = Array.from(el.querySelectorAll('video')).map(v => ({
                    src: v.src || v.querySelector('source')?.src || "",
                    poster: v.poster || ""
                })).filter(v => v.src);

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

            // Catch any videos in DOM
            document.querySelectorAll('video').forEach((v, idx) => {
                const src = v.src || v.querySelector('source')?.src;
                const poster = v.poster || "";
                if (src && !data.posts.some(p => p.videos && p.videos.some(vid => vid.src === src))) {
                    data.posts.push({
                        id: "video-dom-" + idx,
                        text: "Video",
                        videos: [{ src: src, poster: poster }],
                        images: []
                    });
                }
            });

            return data;
        }''')

        print(f"Scraped User Info: {extracted_data['user']}")
        print(f"Scraped Posts: {len(extracted_data['posts'])}")

        with open("ardakara_data.json", "w", encoding="utf-8") as f:
            json.dump(extracted_data, f, ensure_ascii=False, indent=2)

        if captured_json_data:
            with open("ardakara_api.json", "w", encoding="utf-8") as f:
                json.dump(captured_json_data, f, ensure_ascii=False, indent=2)

        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
