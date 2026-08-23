import requests, json

r = requests.get('https://api.fxtwitter.com/abbeyvelvett', headers={'User-Agent': 'Mozilla/5.0'})
print("USER DATA:", json.dumps(r.json(), indent=2))
