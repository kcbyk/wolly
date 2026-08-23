import re, json

with open("abbeyvelvett_page.html", "r", encoding="utf-8") as f:
    html = f.read()

print("HTML LENGTH:", len(html))

# Extract MP4s
mp4_regex = r'https://[^\s"\'\\]+\.mp4[^\s"\'\\]*'
matches = list(set(re.findall(mp4_regex, html)))
clean_mp4s = [m.replace('\\u0026', '&').replace('\\', '') for m in matches if 'video-s.twimg.com' in m or 'video.twimg.com' in m]

print(f"FOUND {len(clean_mp4s)} UNIQUE MP4 VIDEOS!")
for i, u in enumerate(clean_mp4s[:5]):
    print(f"  {i+1}: {u}")
