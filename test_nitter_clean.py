import requests, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

USERNAME = "AbbeyVelvett"

print("=== Nitter instances test ===")
nitter_list = [
    "https://n.ramle.be",
    "https://nitter.it",
    "https://nitter.privacyredirect.com",
    "https://nitter.esmailelbob.xyz",
    "https://nitter.unixfox.eu",
    "https://nitter.1d4.us",
    "https://nitter.io.projectsegfau.lt",
    "https://bird.habedieeh.re",
]
for base in nitter_list:
    try:
        r = requests.get(f"{base}/{USERNAME}/media",
                        headers={"User-Agent": "Mozilla/5.0"}, timeout=6)
        if r.status_code == 200 and len(r.text) > 5000:
            tids = re.findall(r'/status/(\d{17,20})', r.text)
            print(f"  {base}: SUCCESS {len(tids)} tweet IDs: {tids[:5]}")
            if tids:
                # Fetch first video via fxtwitter
                tr = requests.get(f"https://api.fxtwitter.com/{USERNAME}/status/{tids[0]}", 
                                 headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
                if tr.status_code == 200:
                    tweet = tr.json().get("tweet", {})
                    videos = tweet.get("media", {}).get("videos", [])
                    print(f"    fxtwitter videos: {[v.get('url','')[:70] for v in videos]}")
            break
        else:
            print(f"  {base}: {r.status_code}, {len(r.text)} bytes")
    except Exception as e:
        print(f"  {base}: {type(e).__name__}: {str(e)[:50]}")
