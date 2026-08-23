import requests, sys, hmac, hashlib, base64, time, uuid, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

ACCESS_TOKEN = "1504390433970999310-htAtRcnFxSdGEVC1vLFBuZuzitr0fv"
ACCESS_SECRET = "k7taiwkymuKimroZBg9QESyEHmCnf3L2P6XUJXphVvp6f"
USERNAME = "AbbeyVelvett"

# Test 1: Check if this is actually a Bearer Token (won't be, but let's try)
print("=== Test: Using as Bearer Token ===")
r = requests.get(
    f"https://api.twitter.com/2/tweets/search/recent?query=from:{USERNAME}&max_results=10",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    timeout=8
)
print(f"Status: {r.status_code}, Response: {r.text[:200]}")

# Test 2: Check developer portal keys section
print("\n=== Format Analysis ===")
print(f"Token 1 length: {len(ACCESS_TOKEN)}")
print(f"Token 2 length: {len(ACCESS_SECRET)}")
print(f"Token 1 starts with numeric ID? {'Yes' if ACCESS_TOKEN[:19].isdigit() else 'No'}")
print("Conclusion: These look like Access Token + Access Token Secret")
print("We still need: API Key, API Key Secret, AND Bearer Token from developer portal")
print("\nIn Twitter Developer Portal -> Keys and Tokens:")
print("  - API Key (Consumer Key): ~25 chars alphanumeric")
print("  - API Key Secret (Consumer Secret): ~50 chars alphanumeric")
print("  - Bearer Token: starts with AAAAAAA..., very long")
