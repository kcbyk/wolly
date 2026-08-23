import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ1OTkwNSwiZXhwIjoyMTAzMDM1OTA1fQ.H609VYClmuWrcW68OegHVdHjLun0-nNlawAymHPZayY"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTk5MDUsImV4cCI6MjEwMzAzNTkwNX0.jkxCM-PCrKkoOIZK4WP9bF21bqNjBgVpl-GAQUymKGc"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# Test connection with service_role key
print("=== Supabase Admin Test ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:200]}")

# SQL for creating 'users' and 'posts' tables
SQL = """
-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    avatar TEXT,
    banner TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT false,
    badge_type TEXT DEFAULT 'none',
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TEXT DEFAULT 'Yeni',
    media_type TEXT DEFAULT 'video',
    media JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{"likes": 0, "replies": 0, "retweets": 0, "bookmarks": 0}'::jsonb,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) and allow public read
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

CREATE POLICY "Service Role Full Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service Role Full Posts" ON public.posts FOR ALL USING (true);

-- Allow Anon insert/update if needed for likes or scraper
CREATE POLICY "Anon Full Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);
"""

# Try executing SQL via pg REST query endpoint
sql_res = requests.post(
    f"{SUPABASE_URL}/pg/query",
    headers=headers,
    json={"query": SQL}
)
print(f"PG Query Status: {sql_res.status_code}")
print(f"PG Query Response: {sql_res.text[:400]}")
