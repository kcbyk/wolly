import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tnyqnqucjywknquhbwbg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXFucXVjanl3a25xdWhid2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTk5MDUsImV4cCI6MjEwMzAzNTkwNX0.jkxCM-PCrKkoOIZK4WP9bF21bqNjBgVpl-GAQUymKGc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch posts from Supabase (defaults to fetching all available posts up to 5000)
 */
export async function getPostsFromSupabase(page = 0, pageSize = 5000, userId = null) {
  try {
    let query = supabase
      .from('posts')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (pageSize > 0) {
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase fetch posts error:', error);
      return [];
    }

    // Format fields to match frontend expectation
    return (data || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      content: p.content,
      createdAt: p.created_at || "Yeni",
      mediaType: p.media_type || "video",
      media: p.media || [],
      stats: p.stats || { likes: 100, replies: 10, retweets: 20, bookmarks: 15 }
    }));
  } catch (err) {
    console.error('Supabase getPosts error:', err);
    return [];
  }
}

/**
 * Fetch total post and video count directly from Supabase
 */
export async function getPostCountFromSupabase() {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase count error:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Supabase getPostCount error:', err);
    return 0;
  }
}

/**
 * Fetch all users from Supabase
 */
export async function getUsersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('posts_count', { ascending: false });

    if (error) {
      console.error('Supabase fetch users error:', error);
      return [];
    }

    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`,
      banner: u.banner || "",
      bio: u.bio || `@${u.id} paylaşımları`,
      verified: !!u.verified,
      badgeType: u.badge_type || "none",
      following: u.following || 0,
      followers: u.followers || 0,
      postsCount: u.posts_count || 0
    }));
  } catch (err) {
    console.error('Supabase getUsers error:', err);
    return [];
  }
}
