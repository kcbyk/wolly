import requests, json

username = "AbbeyVelvett"

# Test 1: fxtwitter user timeline / media
endpoints = [
    f"https://api.fxtwitter.com/{username}",
    f"https://api.vxtwitter.com/Twitter/status/1787463434",
    f"https://api.allorigins.win/raw?url=https://api.fxtwitter.com/{username}",
    f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{username}",
    f"https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names={username}"
]

for ep in endpoints:
    try:
        r = requests.get(ep, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}, timeout=6)
        print(f"{ep} -> STATUS: {r.status_code}, LEN: {len(r.text)}")
        if r.status_code == 200:
            print("  PREVIEW:", r.text[:200])
    except Exception as e:
        print(f"{ep} -> ERROR: {e}")
