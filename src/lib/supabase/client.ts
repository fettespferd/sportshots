import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Use placeholder values that pass Supabase validation during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xyzcompany.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjQ0ODAwMCwiZXhwIjoxOTU4MDI0MDAwfQ.placeholder";

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}

