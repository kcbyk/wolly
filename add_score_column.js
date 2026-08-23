import pg from 'pg';

const { Client } = pg;

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

async function addScoreColumn() {
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
    console.log('[*] Adding score column and indexes to public.posts...');
    await client.query(`
      ALTER TABLE public.posts
        ADD COLUMN IF NOT EXISTS score DOUBLE PRECISION DEFAULT 0.5,
        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_posts_score ON public.posts (score DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_inserted_at ON public.posts (inserted_at DESC);
    `);
    console.log('[+] Successfully added score column and indexes to Supabase!');
  } catch (err) {
    console.error('[-] Alter table error:', err.message);
  } finally {
    await client.end();
  }
}

addScoreColumn();
