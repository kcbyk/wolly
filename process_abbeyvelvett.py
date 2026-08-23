import json, re, time

with open('abbeyvelvett_full.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract videos from html
mp4_regex = r'https://[^\s"\'\\]+\.mp4[^\s"\'\\]*'
raw_matches = re.findall(mp4_regex, html)
clean_mp4s = []
seen = set()
for m in raw_matches:
    url = m.replace('\\u0026', '&').replace('\\', '')
    if ('video-s.twimg.com' in url or 'video.twimg.com' in url or '.mp4' in url) and url not in seen:
        seen.add(url)
        clean_mp4s.append(url)

print(f"FOUND {len(clean_mp4s)} UNIQUE HD MP4 VIDEOS FOR @abbeyvelvett!")

now_ts = int(time.time())
posts = []
for idx, mp4 in enumerate(clean_mp4s):
    posts.append({
        "id": f"abbeyvelvett_{idx+1}_{now_ts}",
        "userId": "AbbeyVelvett",
        "content": f"@AbbeyVelvett Özel Paylaşım #{idx+1}",
        "createdAt": "Yeni",
        "mediaType": "video",
        "media": [{
            "type": "video",
            "url": mp4,
            "poster": "",
            "alt": f"@AbbeyVelvett video {idx+1}"
        }],
        "stats": {
            "likes": 250 + idx * 18,
            "replies": 24 + idx * 2,
            "retweets": 85 + idx * 5,
            "bookmarks": 40 + idx * 3
        }
    })

user = {
    "id": "AbbeyVelvett",
    "name": "Abbey Velvet",
    "handle": "AbbeyVelvett",
    "avatar": "https://pbs.twimg.com/profile_images/1162733730399686656/n27YMOaF_normal.jpg",
    "bio": "Reklam ve İşbirliği için DM✉️ Paylaşmamı istediğiniz videolarınızı özelden gönderebilirsiniz. Antalya.",
    "verified": True,
    "badgeType": "blue",
    "stats": {
        "followers": 6144,
        "following": 205,
        "posts": len(posts)
    }
}

result = {
    "user": user,
    "posts": posts
}

with open("abbeyvelvett_extracted.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Saved abbeyvelvett_extracted.json successfully!")
