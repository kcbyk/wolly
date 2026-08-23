import requests, re

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"}
USERNAME = "AbbeyVelvett"

r = requests.get(f"https://xcancel.com/{USERNAME}/media", headers=headers, timeout=8)
print(f"Status: {r.status_code}")
# Print a section of the HTML to understand structure
html = r.text
print("\n--- HTML Preview (first 2000 chars) ---")
print(html[:2000])
print("\n--- Looking for links ---")
links = re.findall(r'href="([^"]*status[^"]*)"', html)
print(f"Status links: {links[:10]}")
nums = re.findall(r'(\d{17,20})', html)
print(f"Number IDs: {list(dict.fromkeys(nums))[:10]}")
