import asyncio, json, os, re
from playwright.async_api import async_playwright

async def scrape_target(url="https://www.sotwe.com/abbeyvelvett?lang=tr"):
    print(f"Scraping {url}...")
    user_data_dir = os.path.join(os.getcwd(), ".chrome_user_data")
    os.makedirs(user_data_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=True,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        captured_data = []
        async def on_response(response):
            try:
                if "api.sotwe.com" in response.url or "user" in response.url:
                    if response.status == 200 and "application/json" in response.headers.get("content-type", ""):
                        data = await response.json()
                        captured_data.append(data)
                        print(f"Captured JSON API response from {response.url}")
            except Exception:
                pass
                
        page.on("response", on_response)
        
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(5)
        
        # Scroll down to load more videos
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, window.innerHeight * 2)")
            await asyncio.sleep(2)
            
        html = await page.content()
        with open("abbeyvelvett_page.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        if captured_data:
            with open("abbeyvelvett_api.json", "w", encoding="utf-8") as f:
                json.dump(captured_data, f, ensure_ascii=False, indent=2)
                
        print(f"Page scraped successfully! Captured API entries: {len(captured_data)}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_target())
