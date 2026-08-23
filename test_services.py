import requests

headers = {'User-Agent': 'Mozilla/5.0'}
services = [
    'https://api.fxtwitter.com/abbeyvelvett',
    'https://api.vxtwitter.com/abbeyvelvett',
    'https://twstalker.com/abbeyvelvett',
    'https://nitter.poast.org/abbeyvelvett',
    'https://nitter.lucabased.xyz/abbeyvelvett',
]

for s in services:
    try:
        r = requests.get(s, headers=headers, timeout=5)
        print(f"{s} -> {r.status_code}, len: {len(r.text)}")
        if r.status_code == 200:
            print("SAMPLE:", r.text[:200])
    except Exception as e:
        print(f"{s} -> Error: {e}")
