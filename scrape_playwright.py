import json
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        stealth = Stealth()
        await stealth.apply_stealth_async(page)

        api_responses = []

        async def handle_response(response):
            if "api" in response.url or "sotwe" in response.url or "tweet" in response.url:
                try:
                    ct = response.headers.get("content-type", "")
                    if "json" in ct:
                        body = await response.json()
                        api_responses.append({"url": response.url, "data": body})
                        print(f"Captured API: {response.url}")
                except Exception:
                    pass

        page.on("response", handle_response)

        print("Navigating to https://www.sotwe.com/ardakara222?lang=tr ...")
        try:
            await page.goto("https://www.sotwe.com/ardakara222?lang=tr", wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print("Navigation note:", e)

        print("Waiting 10s for page and anti-bot verification...")
        await page.wait_for_timeout(10000)

        # Scroll to load tweets/videos
        for i in range(5):
            await page.evaluate("window.scrollBy(0, 800)")
            await page.wait_for_timeout(2000)

        title = await page.title()
        print("Page Title:", title)

        content = await page.content()
        with open("playwright_page.html", "w", encoding="utf-8") as f:
            f.write(content)

        if api_responses:
            with open("playwright_api.json", "w", encoding="utf-8") as f:
                json.dump(api_responses, f, ensure_ascii=False, indent=2)

        # Extract media & user info
        extracted = await page.evaluate('''() => {
            const data = {
                user: {},
                posts: []
            };

            // Avatar & Name
            const avatarEl = document.querySelector('img[src*="profile_images"], .profile-avatar img, img[alt*="avatar"]');
            const nameEl = document.querySelector('h1, h2, .profile-name, [class*="name"]');
            const handleEl = document.querySelector('.profile-handle, [class*="handle"], [class*="username"]');
            const bioEl = document.querySelector('.profile-bio, [class*="bio"], [class*="description"]');

            data.user = {
                name: nameEl ? nameEl.innerText.trim() : "Arda Kara",
                handle: "ardakara222",
                avatar: avatarEl ? avatarEl.src : "",
                bio: bioEl ? bioEl.innerText.trim() : ""
            };

            // Find all videos on page
            document.querySelectorAll('video').forEach((v, idx) => {
                const src = v.src || v.querySelector('source')?.src;
                const poster = v.poster || "";
                const container = v.closest('article, [class*="post"], [class*="card"], [class*="tweet"], div');
                const text = container ? container.innerText.slice(0, 200) : "";
                if (src) {
                    data.posts.push({
                        id: "scraped-v-" + idx,
                        type: "video",
                        url: src,
                        poster: poster,
                        text: text
                    });
                }
            });

            // Find all tweet images
            document.querySelectorAll('article img, [class*="post"] img, [class*="card"] img').forEach((img, idx) => {
                const src = img.src;
                if (src && !src.includes('profile_images') && !src.includes('data:') && !src.includes('avatar')) {
                    const container = img.closest('article, [class*="post"], [class*="card"], [class*="tweet"]');
                    const text = container ? container.innerText.slice(0, 200) : "";
                    data.posts.push({
                        id: "scraped-img-" + idx,
                        type: "image",
                        url: src,
                        text: text
                    });
                }
            });

            return data;
        }''')

        print(f"User: {extracted.get('user')}")
        print(f"Posts found: {len(extracted.get('posts', []))}")
        with open("scraped_sotwe.json", "w", encoding="utf-8") as f:
            json.dump(extracted, f, ensure_ascii=False, indent=2)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
