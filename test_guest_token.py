import requests, json, sys, re

sys.stdout.reconfigure(encoding='utf-8')

USERNAME = "AbbeyVelvett"

# Try multiple approaches to get tweet IDs + videos server-side
print("=== TEST 1: fxtwitter individual tweet test ===")
# We know media_count = 191. Let's try fetching a specific status ID from Twitter
# User ID: 863381118 (from previous fxtwitter profile fetch)
USER_ID = "863381118"

# Try Twitter's API v2 without auth (guest token approach)
print("\n=== TEST 2: Twitter guest token ===")
headers_browser = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36",
    "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I%2BxHQkA1D37q=yM5cCNzYBRBB6g6OoNMIPc3mPzY96Qe0F4g7XjVh09kApWfcSxlDIE",
    "x-guest-token": "",
}

# Step 1: Get guest token
try:
    r = requests.post("https://api.twitter.com/1.1/guest/activate.json",
                     headers=headers_browser, timeout=8)
    print(f"Guest token response: {r.status_code}, {r.text[:200]}")
    if r.status_code == 200:
        gt = r.json().get("guest_token", "")
        print(f"Guest token: {gt}")
        headers_browser["x-guest-token"] = gt
        
        # Step 2: Get user media timeline
        params = {
            "include_tweet_replies": "0",
            "include_want_retweets": "1",
            "include_mutes_filters": "0",
            "include_can_dm": "0",
            "include_can_media_tag": "1",
            "include_ext_has_nativeretweets": "0",
            "include_cards": "1",
            "include_ext_alt_text": "true",
            "tweet_mode": "extended",
            "count": "20"
        }
        r2 = requests.get(
            f"https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name={USERNAME}&count=20&tweet_mode=extended",
            headers=headers_browser, timeout=8
        )
        print(f"\nUser timeline: {r2.status_code}, {len(r2.text)} bytes")
        if r2.status_code == 200:
            data = r2.json()
            print(f"Tweets: {len(data)}")
            for tweet in data[:5]:
                tid = tweet.get("id_str", "")
                has_video = "extended_entities" in tweet and any(
                    m.get("type") == "video" for m in tweet.get("extended_entities", {}).get("media", [])
                )
                print(f"  Tweet {tid}: has_video={has_video}")
                if has_video:
                    for m in tweet["extended_entities"]["media"]:
                        if m.get("type") == "video":
                            variants = m.get("video_info", {}).get("variants", [])
                            best = max([v for v in variants if v.get("content_type") == "video/mp4"],
                                      key=lambda x: x.get("bitrate", 0), default={})
                            print(f"    VIDEO URL: {best.get('url', '')}")
        else:
            print(f"Error: {r2.text[:300]}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n=== TEST 3: vxtwitter API ===")
try:
    r = requests.get(f"https://api.vxtwitter.com/{USERNAME}", timeout=8)
    print(f"vxtwitter profile: {r.status_code}, {r.text[:400]}")
except Exception as e:
    print(f"ERROR: {e}")
