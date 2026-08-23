import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTk5MDUsImV4cCI6MjEwMzAzNTkwNX0.jkxCM-PCrKkoOIZK4WP9bF21bqNjBgVpl-GAQUymKGc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print("=== Supabase Connection Test ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:300]}")
