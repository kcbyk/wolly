import requests, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

USERNAME = "AbbeyVelvett"

# Check more nitter instances and check what bird.habedieeh.re returned
print("=== bird.habedieeh.re full check ===")
r = requests.get(f"https://bird.habedieeh.re/{USERNAME}/media",
                headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
print(f"Status: {r.status_code}, {len(r.text)} bytes")
html = r.text
# Print sample to see structure
print("HTML sample:")
print(html[:1000].encode('ascii', errors='replace').decode())
tids = re.findall(r'/status/(\d{15,20})', html)
print(f"\nTweet IDs: {tids[:10]}")

print("\n=== More nitter instances ===")
more_nitters = [
    "https://nitter.cz",
    "https://nitter.hu",
    "https://nitter.moomoo.me",
    "https://nitter.nl",
    "https://nitter.eu",
    "https://nitter.foss.wtf",
    "https://nitter.42l.fr",
    "https://tw.artemislena.eu",
    "https://nitter.pussthecat.org",
]
for base in more_nitters:
    try:
        r = requests.get(f"{base}/{USERNAME}/media",
                        headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        tids = re.findall(r'/status/(\d{17,20})', r.text)
        print(f"  {base}: {r.status_code}, {len(r.text)}b, {len(tids)} IDs")
        if tids:
            print(f"    IDs: {tids[:5]}")
            break
    except Exception as e:
        print(f"  {base}: {type(e).__name__}")
