export const environment = {
  supabaseUrl: (globalThis as any).VITE_SUPABASE_URL || '',
  supabaseAnonKey: (globalThis as any).VITE_SUPABASE_ANON_KEY || ''
};
