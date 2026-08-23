import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ1OTkwNSwiZXhwIjoyMTAzMDM1OTA1fQ.H609VYClmuWrcW68OegHVdHjLun0-nNlawAymHPZayY"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
swagger = r.json()
print("Definitions in public schema:", list(swagger.get("definitions", {}).keys()))
print("Paths in public schema:", list(swagger.get("paths", {}).keys()))
