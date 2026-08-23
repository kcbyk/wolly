/**
 * Wolly Ranking Engine — Supabase Migration
 * 
 * Çalıştır: node ranking_migrate.js
 * 
 * posts tablosuna `score` ve `view_count` kolonu ekler.
 * Bu kolon scraper her çalıştığında otomatik güncellenir.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ1OTkwNSwiZXhwIjoyMTAzMDM1OTA1fQ.H609VYClmuWrcW68OegHVdHjLun0-nNlawAymHPZayY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrate() {
  console.log("=".repeat(60));
  console.log("[*] Wolly Ranking Engine — Supabase Kurulum");
  console.log("=".repeat(60));

  // 1. posts tablosuna score ve view_count ekle (PostgreSQL)
  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE public.posts
        ADD COLUMN IF NOT EXISTS score FLOAT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_posts_score ON public.posts (score DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_inserted ON public.posts (inserted_at DESC);
    `
  });

  if (e1) {
    // RPC yoksa direkt REST PATCH ile sıfır başlat
    console.log("[*] RPC bulunamadı, alternatif yöntem deneniyor...");
    const { data, error: e2 } = await supabase
      .from("posts")
      .select("id, stats, inserted_at, user_id")
      .limit(1);

    if (e2) {
      console.error("[-] Bağlantı hatası:", e2.message);
      process.exit(1);
    }
    console.log("[!] score kolonu zaten var ya da manuel eklenecek.");
    console.log("    Supabase Dashboard > SQL Editor'e gidin ve şunu çalıştırın:");
    console.log("");
    console.log("    ALTER TABLE public.posts");
    console.log("      ADD COLUMN IF NOT EXISTS score FLOAT DEFAULT 0,");
    console.log("      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;");
    console.log("");
    console.log("    CREATE INDEX IF NOT EXISTS idx_posts_score ON public.posts (score DESC);");
  } else {
    console.log("[+] posts tablosuna score ve view_count kolonları eklendi!");
    console.log("[+] score indeksi oluşturuldu (hızlı sıralama için)");
  }

  // 2. users tablosuna popularity_score ekle
  const { error: e3 } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS popularity_score FLOAT DEFAULT 0;
    `
  });

  if (!e3) {
    console.log("[+] users tablosuna popularity_score kolonu eklendi!");
  }

  console.log("\n[✅] Migrasyon tamamlandı! Artık ranking_engine.py çalıştırabilirsiniz.");
}

migrate();
