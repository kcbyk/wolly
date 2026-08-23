"""
Test fxtwitter API for fetching user media tweets
"""
import requests, json

USERNAME = "AbbeyVelvett"
headers = {"User-Agent": "Mozilla/5.0 (compatible; Wolly/1.0)"}

# 1. Get user profile
print("=== USER PROFILE ===")
r = requests.get(f"https://api.fxtwitter.com/{USERNAME}", headers=headers, timeout=8)
print(f"Status: {r.status_code}")
user_data = r.json()
print(json.dumps(user_data, indent=2)[:500])

# 2. Try fetching user media timeline via nitter-like mirrors
print("\n=== TRYING MEDIA ENDPOINTS ===")
endpoints = [
    f"https://api.fxtwitter.com/{USERNAME}/media",
    f"https://api.fxtwitter.com/{USERNAME}/following",
    f"https://api.vxtwitter.com/{USERNAME}/media",
]
for ep in endpoints:
    try:
        r = requests.get(ep, headers=headers, timeout=6)
        print(f"{ep} -> {r.status_code} | {len(r.text)} bytes | {r.text[:200]}")
    except Exception as e:
        print(f"{ep} -> ERROR: {e}")

# 3. Try Nitter RSS for media
print("\n=== NITTER RSS ===")
nitters = [
    f"https://nitter.poast.org/{USERNAME}/media/rss",
    f"https://nitter.net/{USERNAME}/media/rss",
    f"https://xcancel.com/{USERNAME}/media/rss",
]
for nitter in nitters:
    try:
        r = requests.get(nitter, headers={**headers, "Accept": "application/rss+xml"}, timeout=8)
        print(f"{nitter} -> {r.status_code} | {len(r.text)} bytes")
        if r.status_code == 200 and "mp4" in r.text.lower():
            print("  🎉 FOUND MP4 LINKS!")
            import re
            mp4s = re.findall(r'https://[^\s"\'<>]+\.mp4[^\s"\'<>]*', r.text)
            print(f"  MP4s: {mp4s[:3]}")
        elif r.status_code == 200:
            print(f"  Preview: {r.text[:300]}")
    except Exception as e:
        print(f"{nitter} -> ERROR: {e}")
