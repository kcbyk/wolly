import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/abbeyvelvett'
try:
    r = requests.get(url, headers=headers, timeout=10)
    print("STATUS:", r.status_code, "LEN:", len(r.text))
    if r.status_code == 200:
        print("SAMPLE:", r.text[:300])
        if '__NEXT_DATA__' in r.text:
            print("FOUND __NEXT_DATA__!")
            import json, re
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">([^<]+)</script>', r.text)
            if match:
                data = json.loads(match.group(1))
                timeline = data['props']['pageProps']['timeline']
                entries = timeline['entries']
                print(f"TOTAL TWEETS FOUND: {len(entries)}")
                for e in entries[:3]:
                    tweet = e['content']['tweet']
                    print("TWEET ID:", tweet['id_str'], "TEXT:", tweet.get('full_text') or tweet.get('text'))
                    media = tweet.get('extended_entities', {}).get('media', []) or tweet.get('entities', {}).get('media', [])
                    for m in media:
                        print("  MEDIA TYPE:", m.get('type'), "INFO:", m.get('video_info', {}).get('variants', [{}])[0].get('url', 'no-url')[:80])
except Exception as e:
    print("ERROR:", e)
