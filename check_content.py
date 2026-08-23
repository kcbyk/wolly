with open('abbeyvelvett_page.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
title = re.search(r'<title>(.*?)</title>', text)
print("TITLE:", title.group(1) if title else "No title")
if 'Cloudflare' in text or 'Turnstile' in text or 'Just a moment' in text:
    print("CLOUDFLARE DETECTED!")
else:
    print("NO CLOUDFLARE, HTML SNIPPET:", text[:400])
