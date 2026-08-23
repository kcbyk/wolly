import urllib.request
import ssl
import sys

sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://video-s.twimg.com/amplify_video/2091051895167057920/vid/avc1/720x1280/cPfnfkMlXVl47Zh6.mp4?tag=29'

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
        print("STATUS:", r.status, "CONTENT-TYPE:", r.headers.get("Content-Type"), "SIZE:", r.headers.get("Content-Length"))
except Exception as e:
    print("ERROR:", e)
