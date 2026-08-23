import requests

endpoints = [
    'https://nitter.privacydev.net/AbbeyVelvett/media',
    'https://nitter.net/AbbeyVelvett',
    'https://xcancel.com/AbbeyVelvett/media',
    'https://nitter.spaceint.fr/AbbeyVelvett/media',
    'https://light.sotwe.com/AbbeyVelvett',
    'https://sotwe.com/api/v3/user/AbbeyVelvett',
    'https://twitter-api.cyberpurr.workers.dev/user/AbbeyVelvett',
    'https://twstalker.com/search?q=AbbeyVelvett'
]

for ep in endpoints:
    try:
        r = requests.get(ep, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, timeout=5)
        print(f"{ep} -> {r.status_code}, len: {len(r.text)}")
        if r.status_code == 200:
            print("  SAMPLE:", r.text[:200])
    except Exception as e:
        print(f"{ep} -> Error: {e}")
