import requests

# Test if Twitter CDN has 720p / 480p / 360p variants for a 1080p URL
url_1080 = "https://video-s.twimg.com/amplify_video/1749329726219395072/vid/avc1/1920x1080/TLhpDFZruJR8-jSB.mp4?tag=16"
url_720 = "https://video-s.twimg.com/amplify_video/1749329726219395072/vid/avc1/1280x720/TLhpDFZruJR8-jSB.mp4?tag=16"
url_480 = "https://video-s.twimg.com/amplify_video/1749329726219395072/vid/avc1/640x360/TLhpDFZruJR8-jSB.mp4?tag=16"
url_360 = "https://video-s.twimg.com/amplify_video/1749329726219395072/vid/avc1/480x270/TLhpDFZruJR8-jSB.mp4?tag=16"

for name, u in [("1080p", url_1080), ("720p", url_720), ("360p", url_480), ("270p", url_360)]:
    try:
        r = requests.head(u, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        size_mb = int(r.headers.get("Content-Length", 0)) / (1024 * 1024)
        print(f"[{name}] Status: {r.status_code}, Size: {size_mb:.2f} MB | URL: {u}")
    except Exception as e:
        print(f"[{name}] Error: {e}")
