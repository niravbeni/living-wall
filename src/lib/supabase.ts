import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-supabase-url-here") {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

export function getPublicUrl(path: string): string {
  const { data } = getSupabase().storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

const STORAGE_PATH_RE = /\/storage\/v1\/object\/public\/media\/(.+)$/;

/**
 * Rewrite a Supabase Storage URL to go through `/api/media/` so Vercel's
 * edge CDN caches the file and Supabase egress stays low.
 * Non-storage URLs (web/iframe) are returned unchanged.
 */
export function proxyMediaUrl(url: string): string {
  if (!url) return url;
  const match = url.match(STORAGE_PATH_RE);
  if (match) return `/api/media/${match[1]}`;
  return url;
}
