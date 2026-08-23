import requests

url = "https://video-s.twimg.com/amplify_video/2085762501531389952/vid/avc1/1280x720/8aD45tgke4KR17sB.mp4?tag=29"
print(f"Testing URL: {url}")

# Test direct GET
try:
    r = requests.head(url, timeout=10)
    print(f"HEAD status: {r.status_code}, headers: {r.headers}")
except Exception as e:
    print(f"HEAD error: {e}")

# Test with Range request
try:
    r = requests.get(url, headers={"Range": "bytes=0-1000"}, timeout=10)
    print(f"Range GET status: {r.status_code}, content length: {len(r.content)}")
except Exception as e:
    print(f"Range GET error: {e}")

# Test with fake referrer
try:
    r = requests.get(url, headers={"Referer": "https://www.sotwe.com/", "User-Agent": "Mozilla/5.0"}, stream=True, timeout=10)
    print(f"Stream GET with Referer status: {r.status_code}")
except Exception as e:
    print(f"Stream GET error: {e}")
