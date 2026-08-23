import pg from 'pg';
import { MOCK_USERS, MOCK_POSTS } from './src/data/mockData.js';

const { Client } = pg;

// Connection options to try
const configs = [
  {
    connectionString: `postgres://postgres.tnyqnqucjywknquhbwbg:b9SP01GwrVZ6BHCb@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    connectionString: `postgres://postgres.tnyqnqucjywknquhbwbg:b9SP01GwrVZ6BHCb@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    host: 'db.tnyqnqucjywknquhbwbg.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'b9SP01GwrVZ6BHCb',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  }
];

async function initDB() {
  let client = null;
  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`[*] Connecting with config #${i + 1}...`);
      client = new Client(configs[i]);
      await client.connect();
      console.log(`[+] Connected to Supabase PostgreSQL successfully!`);
      break;
    } catch (err) {
      console.log(`[-] Config #${i + 1} failed: ${err.message}`);
      client = null;
    }
  }

  if (!client) {
    console.error('[-] Could not connect to Supabase PostgreSQL with provided configs.');
    return;
  }

  try {
    console.log('[*] Creating tables...');
    await client.query(`
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

      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public Read Users" ON public.users;
      DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
      DROP POLICY IF EXISTS "Public Insert Users" ON public.users;
      DROP POLICY IF EXISTS "Public Insert Posts" ON public.posts;
      DROP POLICY IF EXISTS "Public Update Users" ON public.users;
      DROP POLICY IF EXISTS "Public Update Posts" ON public.posts;
      DROP POLICY IF EXISTS "Public Delete Users" ON public.users;
      DROP POLICY IF EXISTS "Public Delete Posts" ON public.posts;

      CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
      CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
      CREATE POLICY "Public Insert Users" ON public.users FOR INSERT WITH CHECK (true);
      CREATE POLICY "Public Insert Posts" ON public.posts FOR INSERT WITH CHECK (true);
      CREATE POLICY "Public Update Users" ON public.users FOR UPDATE USING (true);
      CREATE POLICY "Public Update Posts" ON public.posts FOR UPDATE USING (true);
      CREATE POLICY "Public Delete Users" ON public.users FOR DELETE USING (true);
      CREATE POLICY "Public Delete Posts" ON public.posts FOR DELETE USING (true);
    `);
    console.log('[+] Schema created & RLS public policies configured!');

    // Migrate mockData into Supabase
    console.log(`[*] Migrating ${MOCK_USERS.length} users and ${MOCK_POSTS.length} posts...`);
    
    for (const u of MOCK_USERS) {
      await client.query(`
        INSERT INTO public.users (id, name, handle, avatar, banner, bio, verified, badge_type, followers, following, posts_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          handle = EXCLUDED.handle,
          avatar = EXCLUDED.avatar,
          bio = EXCLUDED.bio,
          posts_count = EXCLUDED.posts_count
      `, [
        u.id,
        u.name || u.id,
        u.handle || u.id,
        u.avatar || '',
        u.banner || '',
        u.bio || '',
        !!u.verified,
        u.badgeType || 'none',
        u.followers || u.stats?.followers || 0,
        u.following || u.stats?.following || 0,
        u.postsCount || u.stats?.posts || 0
      ]);
    }
    console.log('[+] Users migrated!');

    for (const p of MOCK_POSTS) {
      await client.query(`
        INSERT INTO public.posts (id, user_id, content, created_at, media_type, media, stats)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [
        p.id,
        p.userId,
        p.content || '',
        p.createdAt || 'Yeni',
        p.mediaType || 'video',
        JSON.stringify(p.media || []),
        JSON.stringify(p.stats || { likes: 100, replies: 10, retweets: 20, bookmarks: 15 })
      ]);
    }
    console.log('[+] Posts migrated!');

    const { rows: postCount } = await client.query('SELECT COUNT(*) FROM public.posts');
    const { rows: userCount } = await client.query('SELECT COUNT(*) FROM public.users');
    console.log(`[🎉] Supabase Setup Complete! Total Users in DB: ${userCount[0].count}, Total Posts in DB: ${postCount[0].count}`);

  } catch (err) {
    console.error('[-] Error executing queries:', err);
  } finally {
    await client.end();
  }
}

initDB();
