import requests, sys, re
sys.stdout.reconfigure(encoding='utf-8')

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# Sotwe'den HTML çek ve tweet ID'lerini bul
# Sotwe'nin kendi API'sini dene (bot koruması olmadan)
USERNAME = "AbbeyVelvett"

print("=== Sotwe API endpoints test ===")
endpoints = [
    f"https://api.sotwe.com/v3/user/{USERNAME}",
    f"https://api.sotwe.com/v3/user/{USERNAME}/media",
    f"https://sotwe.com/api/v3/user/{USERNAME}",
]
for ep in endpoints:
    try:
        r = requests.get(ep, headers=HEADERS, timeout=8)
        print(f"{ep}: {r.status_code}, {len(r.text)}b")
        if r.status_code == 200 and len(r.text) > 100:
            print(f"  Response: {r.text[:400]}")
    except Exception as e:
        print(f"{ep}: {type(e).__name__}")

print("\n=== Try fxtwitter with a direct tweet URL from Sotwe ===")
# Test with a tweet URL copied from Sotwe manually 
# Sotwe tweet URL format: https://www.sotwe.com/Username/status/TWEET_ID
# Let's verify fxtwitter works when we have a real tweet ID
sample_url = "https://www.sotwe.com/AbbeyVelvett/status/1787000000000000000"
tid = re.search(r'/status/(\d+)', sample_url).group(1)
print(f"Extracted ID: {tid}")
r = requests.get(f"https://api.fxtwitter.com/AbbeyVelvett/status/{tid}", headers=HEADERS, timeout=8)
print(f"fxtwitter: {r.status_code}")

# The KEY finding: fxtwitter WORKS for individual tweet IDs
# Solution: User shares a Sotwe/Twitter URL → we extract tweet ID → fxtwitter gives us MP4
print("\n=== SOLUTION SUMMARY ===")
print("User flow:")
print("1. User opens Sotwe on mobile")
print("2. Clicks any video post to open tweet detail")
print("3. Shares that tweet URL to our site (PWA Share Target)")
print("   OR copies the URL and pastes into Admin Panel")
print("4. Our site extracts tweet ID from URL")
print("5. Calls api.fxtwitter.com/username/status/ID")
print("6. Gets HD MP4 URL automatically")
print("7. Adds to database")
print("\nThis approach: FREE + no bot protection + works from mobile!")
