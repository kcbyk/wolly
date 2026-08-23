import requests
from bs4 import BeautifulSoup

r = requests.get('https://xcancel.com/AbbeyVelvett/media', headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(r.text, 'html.parser')
timeline = soup.find_all('div', class_='timeline-item')
print(f"FOUND {len(timeline)} timeline items in xcancel.com!")

videos = soup.find_all('video')
print(f"FOUND {len(videos)} video tags!")
for v in videos:
    print("VIDEO SOURCE:", v.find('source').get('src') if v.find('source') else v.get('src'))

# Also let's check attachments and tweets
for item in timeline[:5]:
    text = item.find('div', class_='tweet-content')
    text_str = text.text.strip() if text else 'no text'
    print("TWEET:", text_str[:100])
