import requests, json, sys, re

sys.stdout.reconfigure(encoding='utf-8')

USERNAME = "AbbeyVelvett"

# vxtwitter profile returned data - let's see what media_count related fields look like
print("=== vxtwitter full profile ===")
r = requests.get(f"https://api.vxtwitter.com/{USERNAME}", timeout=8)
data = r.json()
print(json.dumps(data, indent=2, ensure_ascii=False))
