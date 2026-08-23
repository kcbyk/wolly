import requests, json, re

headers = {"User-Agent": "Mozilla/5.0 (compatible; Wolly/1.0)"}
USERNAME = "AbbeyVelvett"

nitters = [
    f"https://nitter.poast.org/{USERNAME}/media",
    f"https://xcancel.com/{USERNAME}/media",
]

for nitter in nitters:
    try:
        r = requests.get(nitter, headers=headers, timeout=8)
        print(f"{nitter} -> {r.status_code} | {len(r.text)} bytes")
        if r.status_code == 200:
            # Extract tweet IDs from nitter page
            tids = re.findall(r'/status/(\d{15,20})', r.text)
            unique_tids = list(dict.fromkeys(tids))[:10]
            print(f"  Tweet IDs found: {unique_tids}")
            # Try fetching first tweet via fxtwitter
            if unique_tids:
                print("\n  Testing fxtwitter for first tweet ID...")
                for tid in unique_tids[:3]:
                    tr = requests.get(f"https://api.fxtwitter.com/{USERNAME}/status/{tid}", headers=headers, timeout=6)
                    if tr.status_code == 200:
                        data = tr.json()
                        tweet = data.get("tweet", {})
                        media = tweet.get("media", {})
                        videos = media.get("videos", [])
                        photos = media.get("photos", [])
                        print(f"    Tweet {tid}: {len(videos)} videos, {len(photos)} photos")
                        for v in videos:
                            print(f"      VIDEO URL: {v.get('url', '')}")
            break
    except Exception as e:
        print(f"{nitter} -> ERROR: {e}")
