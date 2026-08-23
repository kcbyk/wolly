import json

with open("abbeyvelvett_extracted.json", "r", encoding="utf-8") as f:
    abbey = json.load(f)

with open("src/data/mockData.js", "r", encoding="utf-8") as f:
    current_code = f.read()

# Let's create updated mockData.js with both users and both post lists
import re
users_match = re.search(r'export const MOCK_USERS = (\[.*?\]);', current_code, re.DOTALL)
posts_match = re.search(r'export const MOCK_POSTS = (\[.*?\]);', current_code, re.DOTALL)

current_users = json.loads(users_match.group(1)) if users_match else []
current_posts = json.loads(posts_match.group(1)) if posts_match else []

# Append AbbeyVelvett
merged_users = [abbey["user"]] + [u for u in current_users if u["id"] != "AbbeyVelvett"]
merged_posts = abbey["posts"] + [p for p in current_posts if not p["id"].startswith("abbeyvelvett")]

new_file_content = f"""export const MOCK_USERS = {json.dumps(merged_users, ensure_ascii=False, indent=2)};

export const MOCK_POSTS = {json.dumps(merged_posts, ensure_ascii=False, indent=2)};
"""

with open("src/data/mockData.js", "w", encoding="utf-8") as f:
    f.write(new_file_content)

print(f"Updated mockData.js with {len(merged_users)} users and {len(merged_posts)} total posts/videos!")
