import requests, sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Test: Bir tweet URL'sinden video çek
# Sotwe'deki herhangi bir tweet URL'si: https://www.sotwe.com/AbbeyVelvett/status/1234567890
# ya da Twitter: https://twitter.com/AbbeyVelvett/status/1234567890

# Örnek tweet URL'leri test et
test_urls = [
    "https://twitter.com/AbbeyVelvett/status/1883776590488350985",
    "https://x.com/AbbeyVelvett/status/1883776590488350985",
    "https://www.sotwe.com/AbbeyVelvett/status/1883776590488350985",
]

USERNAME = "AbbeyVelvett"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def extract_tweet_id(url):
    m = re.search(r'/status/(\d+)', url)
    return m.group(1) if m else None

def get_video_from_tweet(url):
    tweet_id = extract_tweet_id(url)
    if not tweet_id:
        return None, "Tweet ID bulunamadı"
    
    # fxtwitter ile video URL'si al
    r = requests.get(
        f"https://api.fxtwitter.com/{USERNAME}/status/{tweet_id}",
        headers=HEADERS, timeout=10
    )
    print(f"  fxtwitter status: {r.status_code}")
    if r.status_code != 200:
        return None, f"fxtwitter error: {r.status_code}"
    
    data = r.json()
    tweet = data.get("tweet", {})
    media = tweet.get("media", {})
    videos = media.get("videos", [])
    photos = media.get("photos", [])
    
    print(f"  Tweet: {tweet.get('text','')[:60]}")
    print(f"  Videos: {len(videos)}, Photos: {len(photos)}")
    
    if videos:
        best = videos[0]  # fxtwitter zaten en yüksek kaliteyi veriyor
        return best.get("url"), tweet.get("text", "")
    return None, "Videosuz tweet"

# Test: Bilinen video tweet ID'leri dene
print("=== TWEET URL -> VIDEO TEST ===")
# Önce AbbeyVelvett'in son tweet'ini bul
r = requests.get(f"https://api.fxtwitter.com/{USERNAME}", headers=HEADERS, timeout=8)
print(f"Profile: {r.status_code}, tweets={r.json().get('user',{}).get('tweets', 'N/A')}")

# Birkaç tahmin ID dene (yakın tarihli)
import time
# AbbeyVelvett user ID: 863381118
# Son birkaç tweet ID'sini deneyerek bul
test_tweet_ids = [
    "1858818244882886745",
    "1856261778862977140",
    "1853747393818202317",
    "1851208095754002491",
    "1848685374827429952",
]

print("\n=== Testing random recent tweet IDs ===")
for tid in test_tweet_ids[:3]:
    print(f"\nTweet ID: {tid}")
    r = requests.get(f"https://api.fxtwitter.com/{USERNAME}/status/{tid}", headers=HEADERS, timeout=8)
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        tweet = r.json().get("tweet", {})
        media = tweet.get("media", {})
        videos = media.get("videos", [])
        print(f"  Text: {tweet.get('text','')[:60]}")
        print(f"  Videos: {len(videos)}")
        for v in videos:
            print(f"  VIDEO: {v.get('url','')[:80]}")
