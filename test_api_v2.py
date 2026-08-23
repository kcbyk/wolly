import requests, sys, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

BEARER_TOKEN_RAW = "AAAAAAAAAAAAAAAAAAAAAAnR%2FAEAAAAAERVdJ1CXvxxQ0TKozl%2FewEQyD6U%3D5r2L03b3vzHlNUhPbbVw7oEuATOdmwSHdKlPPjzqDkmBa28VFQ"
BEARER_TOKEN = urllib.parse.unquote(BEARER_TOKEN_RAW)
API_KEY = "TO47UepMyv5bf60AiN3zyhX9g"
API_SECRET = "UhlwUADUaUnhkABPSKy6T9zQkd6FVld6FaxaWaGpDOmYo6Pggt"
ACCESS_TOKEN = "1504390433970999310-htAtRcnFxSdGEVC1vLFBuZuzitr0fv"
ACCESS_SECRET = "k7taiwkymuKimroZBg9QESyEHmCnf3L2P6XUJXphVvp6f"

USERNAME = "AbbeyVelvett"
print(f"Bearer Token (decoded): {BEARER_TOKEN[:60]}...")

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "User-Agent": "Wolly/1.0"
}

# Step 1: Get User ID from username
print("\n=== Step 1: Get User ID ===")
r = requests.get(
    f"https://api.twitter.com/2/users/by/username/{USERNAME}",
    headers=headers, timeout=10
)
print(f"Status: {r.status_code}, Response: {r.text[:300]}")

if r.status_code == 200:
    user_id = r.json()["data"]["id"]
    print(f"User ID: {user_id}")
    
    # Step 2: Get user media tweets
    print(f"\n=== Step 2: Get media tweets for user {user_id} ===")
    r2 = requests.get(
        f"https://api.twitter.com/2/users/{user_id}/tweets",
        headers=headers,
        params={
            "max_results": 10,
            "tweet.fields": "attachments,created_at",
            "expansions": "attachments.media_keys",
            "media.fields": "url,preview_image_url,variants,type,duration_ms"
        },
        timeout=10
    )
    print(f"Status: {r2.status_code}, Len: {len(r2.text)}")
    if r2.status_code == 200:
        data = r2.json()
        tweets = data.get("data", [])
        media_list = {m["media_key"]: m for m in data.get("includes", {}).get("media", [])}
        print(f"Tweets: {len(tweets)}, Media items: {len(media_list)}")
        for tweet in tweets[:5]:
            for mk in tweet.get("attachments", {}).get("media_keys", []):
                m = media_list.get(mk, {})
                if m.get("type") == "video":
                    variants = m.get("variants", [])
                    best = max([v for v in variants if v.get("content_type") == "video/mp4"],
                              key=lambda x: x.get("bit_rate", 0), default={})
                    print(f"  Tweet {tweet['id']}: VIDEO -> {best.get('url','')[:80]}")
    else:
        print(r2.text[:400])
