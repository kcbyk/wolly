import requests, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

USERNAME = "AbbeyVelvett"

# Try to get the bearer token fresh from twitter.com like a real browser would
print("=== Step 1: Get Bearer Token from twitter.com JS ===")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

# Twitter's main.js contains the bearer token
try:
    r = requests.get("https://abs.twimg.com/responsive-web/client-web/main.29234e67.js", 
                    headers=headers, timeout=10)
    if r.status_code == 200:
        # Extract bearer token pattern
        match = re.search(r'AAAAAAAAAAAAAAAAAAAAA[A-Za-z0-9%]+', r.text)
        if match:
            print(f"Found token: {match.group()[:50]}...")
except Exception as e:
    print(f"Error: {e}")

# Alternative: try twscrape-based approach with a simpler guest token method
print("\n=== Step 2: Try twitter.com flow for guest token ===")
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9",
})

# First visit twitter.com to get cookies
r1 = session.get("https://twitter.com", timeout=10, allow_redirects=True)
print(f"twitter.com: {r1.status_code}, cookies: {dict(session.cookies)}")

# Then activate guest token
r2 = session.post(
    "https://api.twitter.com/1.1/guest/activate.json",
    headers={
        "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I%2BxHQkA1D37q%3DyM5cCNzYBRBB6g6OoNMIPc3mPzY96Qe0F4g7XjVh09kApWfcSxlDIE",
        "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout=10
)
print(f"Guest activate: {r2.status_code}, {r2.text[:200]}")

print("\n=== Step 3: Try Nitter instances that are working ===")
nitter_list = [
    "https://n.ramle.be",
    "https://nitter.it",
    "https://nitter.privacyredirect.com", 
    "https://nitter.esmailelbob.xyz",
    "https://nitter.unixfox.eu",
    "https://nitter.1d4.us",
]
for base in nitter_list:
    try:
        r = requests.get(f"{base}/{USERNAME}/media", 
                        headers={"User-Agent": "Mozilla/5.0"}, timeout=6)
        if r.status_code == 200 and len(r.text) > 5000:
            tids = re.findall(r'/status/(\d{17,20})', r.text)
            print(f"  {base}: ✅ {len(tids)} tweet IDs found: {tids[:5]}")
            break
        else:
            print(f"  {base}: {r.status_code}, {len(r.text)} bytes")
    except Exception as e:
        print(f"  {base}: {type(e).__name__}")
