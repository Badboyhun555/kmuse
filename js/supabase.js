/* ==========================================================
   K MUSE NOVA — SUPABASE CLIENT INIT
   ========================================================== */

if (typeof window.supabase === "undefined") {
  console.error("Supabase JS client not loaded. Include the Supabase CDN script.");
} else {
  window.kmnSupabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
}
