import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.sotwe.com/'
}

urls = [
    'https://api.sotwe.com/v3/user/abbeyvelvett',
    'https://www.sotwe.com/api/v3/user/abbeyvelvett',
    'https://www.sotwe.com/abbeyvelvett'
]

for url in urls:
    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"URL: {url} -> Status: {r.status_code}, Length: {len(r.text)}")
        if r.status_code == 200 and 'json' in r.headers.get('Content-Type', ''):
            print("JSON sample:", r.text[:200])
        elif r.status_code == 200:
            print("HTML sample:", r.text[:200])
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
