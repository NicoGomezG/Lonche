// Valores públicos de Supabase: la anon key es segura de exponer en el
// frontend porque el acceso queda acotado por las policies de RLS
// (ver supabase/schema.sql) — solo permite SELECT en instagram_posts.
export const environment = {
  supabaseUrl: 'https://yuqpwtslmnfwskenxcqk.supabase.co',
  supabaseAnonKey: 'sb_publishable_o3q0rujwqVDZunCYh0HMbw_WKQRCI3t',
};
