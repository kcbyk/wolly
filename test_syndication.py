import requests, json, sys, re

sys.stdout.reconfigure(encoding='utf-8')
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Referer": "https://twitter.com/",
    "Origin": "https://twitter.com"
}

USERNAME = "AbbeyVelvett"

# Twitter syndication API — used for embedded timelines (no auth needed)
print("=== TWITTER SYNDICATION TIMELINE API ===")
endpoints = [
    f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{USERNAME}?count=20&withLinkPreviews=true",
    f"https://cdn.syndication.twimg.com/timeline/profile?screen_name={USERNAME}&count=20&with_replies=false",
    f"https://syndication.twitter.com/timeline/profile?screen_name={USERNAME}&count=20&lang=tr",
]
for ep in endpoints:
    try:
        r = requests.get(ep, headers=headers, timeout=10)
        print(f"\n{ep[:80]}")
        print(f"  Status: {r.status_code}, Len: {len(r.text)}")
        if r.status_code == 200 and len(r.text) > 100:
            # Look for video/mp4 URLs
            mp4s = re.findall(r'https://[^\s"\'\\<>]+\.mp4[^\s"\'\\<>]*', r.text)
            tids = re.findall(r'"id_str"\s*:\s*"(\d{15,20})"', r.text)
            print(f"  MP4s: {mp4s[:3]}")
            print(f"  Tweet IDs: {tids[:5]}")
            print(f"  Preview: {r.text[:400]}")
    except Exception as e:
        print(f"  ERROR: {e}")
