"""
Test scraper scrolling and video detection on Sotwe
"""
import sys, os, asyncio, json, time, re
from playwright.async_api import async_playwright

USERNAME = "AbbeyVelvett"
TARGET_COUNT = 50

async def test_scroll():
    url = f"https://www.sotwe.com/{USERNAME}?lang=tr"
    print(f"[*] Testing deep scroll for @{USERNAME} targeting {TARGET_COUNT} videos...")
    
    user_data_dir = os.path.join(os.getcwd(), ".chrome_user_data")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        # Intercept network responses for mp4 or json tweets!
        captured_mp4s = set()
        
        def handle_response(response):
            try:
                url_str = response.url
                if '.mp4' in url_str:
                    clean = url_str.split('&tag=')[0] if '&tag=' in url_str else url_str
                    captured_mp4s.add(url_str)
            except:
                pass
                
        page.on("response", handle_response)
        
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        print("[*] Page loaded. Waiting for initial content...")
        await asyncio.sleep(6)
        
        seen_mp4s = set()
        stalled_count = 0
        
        for i in range(1, 100):
            # 1. Scroll to bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.keyboard.press("PageDown")
            await asyncio.sleep(1.8)
            
            # 2. Check DOM for video tags and mp4 regex
            html = await page.content()
            raw_matches = re.findall(r'https://[^\s"\'\\]+\.mp4[^\s"\'\\]*', html)
            for m in raw_matches:
                v_url = m.replace('\\u0026', '&').replace('\\', '')
                if ('video-s.twimg.com' in v_url or 'video.twimg.com' in v_url or '.mp4' in v_url):
                    seen_mp4s.add(v_url)
                    
            total_found = len(seen_mp4s.union(captured_mp4s))
            print(f"  [Round {i}] Total unique videos found so far: {total_found}")
            
            if total_found >= TARGET_COUNT:
                print(f"[+] Reached target of {TARGET_COUNT} videos!")
                break
                
            # If stalled, scroll up a bit then down to trigger Sotwe scroll listener
            if total_found == len(seen_mp4s):
                stalled_count += 1
                if stalled_count >= 3:
                    print("  [!] Nudging scroll up & down to trigger lazyloader...")
                    await page.evaluate("window.scrollBy(0, -800)")
                    await asyncio.sleep(0.5)
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await asyncio.sleep(2.0)
                if stalled_count >= 8:
                    print("  [*] End of profile reached.")
                    break
            else:
                stalled_count = 0
                
        await browser.close()
        all_videos = list(seen_mp4s.union(captured_mp4s))
        print(f"\n[+] Total unique MP4s found: {len(all_videos)}")

if __name__ == "__main__":
    asyncio.run(test_scroll())
