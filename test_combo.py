import requests, re, sys

sys.stdout.reconfigure(encoding='utf-8')
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"}
USERNAME = "AbbeyVelvett"

r = requests.get(f"https://xcancel.com/{USERNAME}/media", headers=headers, timeout=8)
print(f"Status: {r.status_code}, Len: {len(r.text)}")
html = r.text

# Find status/tweet IDs
links = re.findall(r'href="[^"]*?/status/(\d+)', html)
unique_ids = list(dict.fromkeys(links))
print(f"\nTweet IDs found: {unique_ids[:10]}")

# Now fetch media for each tweet via fxtwitter
if unique_ids:
    print("\n=== Fetching media via fxtwitter ===")
    all_videos = []
    for tid in unique_ids[:5]:
        try:
            tr = requests.get(f"https://api.fxtwitter.com/{USERNAME}/status/{tid}", headers=headers, timeout=6)
            if tr.status_code == 200:
                data = tr.json()
                tweet = data.get("tweet", {})
                media = tweet.get("media", {})
                videos = media.get("videos", [])
                for v in videos:
                    url = v.get("url", "")
                    if url:
                        all_videos.append(url)
                        print(f"  Tweet {tid}: VIDEO -> {url[:80]}")
        except Exception as e:
            print(f"  Tweet {tid}: ERROR {e}")
    print(f"\nTotal videos found: {len(all_videos)}")
else:
    # Print sample HTML
    print("\nNo IDs found. Sample HTML:")
    print(html[500:1500].encode('ascii', errors='replace').decode())
