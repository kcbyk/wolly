import requests, xml.etree.ElementTree as ET, re

rss_mirrors = [
    'https://xcancel.com/abbeyvelvett/rss',
    'https://nitter.poast.org/abbeyvelvett/rss',
    'https://nitter.spaceint.fr/abbeyvelvett/rss',
    'https://nitter.privacydev.net/abbeyvelvett/rss',
]

for mirror in rss_mirrors:
    try:
        r = requests.get(mirror, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, timeout=6)
        print(f"{mirror} -> STATUS: {r.status_code}, LEN: {len(r.text)}")
        if r.status_code == 200 and '<rss' in r.text:
            print("FOUND VALID RSS FEED!")
            root = ET.fromstring(r.content)
            items = root.findall('.//item')
            print(f"Total items in RSS: {len(items)}")
            for item in items[:5]:
                title = item.find('title')
                desc = item.find('description')
                desc_text = desc.text if desc is not None else ""
                # Find mp4 or media in description
                mp4s = re.findall(r'https://[^\s"\'<>]+\.mp4[^\s"\'<>]*', desc_text)
                imgs = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|png|jpeg)[^\s"\'<>]*', desc_text)
                print("  ITEM:", title.text[:40] if title is not None else "No title", "MP4s:", mp4s, "IMGs:", len(imgs))
            break
    except Exception as e:
        print(f"{mirror} -> Error: {e}")
