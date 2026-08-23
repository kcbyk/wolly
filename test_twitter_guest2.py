import requests, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Twitter'ın kendi guest token'ını alma (doğru Bearer token ile)
# Bu token Twitter web uygulamasından alınmış public token
BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I%2BxHQkA1D37q%3DyM5cCNzYBRBB6g6OoNMIPc3mPzY96Qe0F4g7XjVh09kApWfcSxlDIE"
USERNAME = "AbbeyVelvett"

headers = {
    "Authorization": f"Bearer {BEARER}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "tr"
}

print("=== Getting guest token ===")
r = requests.post("https://api.twitter.com/1.1/guest/activate.json", headers=headers, timeout=10)
print(f"Status: {r.status_code}, Response: {r.text[:300]}")

if r.status_code == 200:
    guest_token = r.json()["guest_token"]
    print(f"Got guest token: {guest_token}")
    headers["x-guest-token"] = guest_token
    
    # Try user media timeline
    print("\n=== User timeline ===")
    r2 = requests.get(
        f"https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name={USERNAME}&count=20&tweet_mode=extended&exclude_replies=true&include_rts=false",
        headers=headers, timeout=10
    )
    print(f"Timeline status: {r2.status_code}")
    if r2.status_code == 200:
        tweets = r2.json()
        print(f"Got {len(tweets)} tweets")
        for t in tweets[:10]:
            has_video = "extended_entities" in t and any(
                m.get("type") == "video" for m in t.get("extended_entities", {}).get("media", [])
            )
            print(f"  {t['id_str']}: video={has_video}")
            if has_video:
                for m in t["extended_entities"]["media"]:
                    if m.get("type") == "video":
                        best = max(
                            [v for v in m["video_info"]["variants"] if v.get("content_type") == "video/mp4"],
                            key=lambda x: x.get("bitrate", 0), default={}
                        )
                        print(f"    🎥 {best.get('url','')[:80]}")
    else:
        print(r2.text[:400])
else:
    print("No guest token, trying direct call")
    # Try without guest token - some endpoints work
    r3 = requests.get(
        f"https://api.twitter.com/2/tweets/search/recent?query=from:{USERNAME}&tweet.fields=attachments&max_results=10",
        headers=headers, timeout=10
    )
    print(f"Search v2: {r3.status_code}, {r3.text[:300]}")
