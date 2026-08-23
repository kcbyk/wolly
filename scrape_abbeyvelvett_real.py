import asyncio, json, os, re
from playwright.async_api import async_playwright

async def scrape():
    user_data_dir = os.path.join(os.getcwd(), ".chrome_user_data")
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        captured_data = []
        async def on_response(response):
            try:
                if "api.sotwe.com" in response.url or "user" in response.url:
                    if response.status == 200:
                        data = await response.json()
                        captured_data.append(data)
                        print("CAPTURED API:", response.url)
            except Exception:
                pass
        page.on("response", on_response)
        
        await page.goto("https://www.sotwe.com/abbeyvelvett?lang=tr", wait_until="domcontentloaded")
        print("Waiting for page load and scrolling...")
        await asyncio.sleep(8)
        
        for i in range(10):
            await page.evaluate("window.scrollBy(0, 1500)")
            await asyncio.sleep(1.5)
            
        html = await page.content()
        with open("abbeyvelvett_full.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        if captured_data:
            with open("abbeyvelvett_api.json", "w", encoding="utf-8") as f:
                json.dump(captured_data, f, ensure_ascii=False, indent=2)
                
        print("Scrape completed!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape())
