import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

async function executeMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }

  // Read migration file
  const migrationPath = path.join(
    process.cwd(),
    "src/supabase/migrations/20250130000000_add_edited_photos.sql"
  );

  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create a temporary function to execute the migration
  // We'll use DO block to execute multiple statements
  const executeSQL = `
DO $$
BEGIN
  -- Add edited_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'edited_url'
  ) THEN
    ALTER TABLE photos ADD COLUMN edited_url TEXT;
  END IF;

  -- Drop and recreate INSERT policy
  DROP POLICY IF EXISTS "Photographers can upload photos to all folders" ON storage.objects;
  
  CREATE POLICY "Photographers can upload photos to all folders"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos' AND
    (
      (storage.foldername(name))[1] = 'originals' OR
      (storage.foldername(name))[1] = 'watermarks' OR
      (storage.foldername(name))[1] = 'thumbnails' OR
      (storage.foldername(name))[1] = 'covers' OR
      (storage.foldername(name))[1] = 'edited'
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('photographer', 'admin')
      AND (
        profiles.photographer_status = 'approved' OR
        profiles.role = 'admin'
      )
    )
  );

  -- Drop and recreate UPDATE policy
  DROP POLICY IF EXISTS "Photographers can update photos in all folders" ON storage.objects;
  
  CREATE POLICY "Photographers can update photos in all folders"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos' AND
    (
      (storage.foldername(name))[1] = 'originals' OR
      (storage.foldername(name))[1] = 'watermarks' OR
      (storage.foldername(name))[1] = 'thumbnails' OR
      (storage.foldername(name))[1] = 'covers' OR
      (storage.foldername(name))[1] = 'edited'
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('photographer', 'admin')
      AND (
        profiles.photographer_status = 'approved' OR
        profiles.role = 'admin'
      )
    )
  );
END $$;
`;

  // Execute via RPC - we need to create a function first
  // Since Supabase doesn't support direct SQL execution,
  // we'll use the Management API or execute statements individually
  
  // Try to execute via REST API using a helper function
  // First, create a function that can execute SQL
  const createExecFunction = `
CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
END;
$$;
`;

  try {
    // Try to execute via RPC
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql_text: executeSQL
    });

    if (rpcError) {
      // Function doesn't exist, try creating it first
      console.log("Creating exec_sql function...");
      // We can't create functions via REST API easily, so we'll need manual execution
      throw new Error("RPC function not available. Please execute migration manually.");
    }

    console.log("✅ Migration executed successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

// Export for use in API route
export { executeMigration };

// If run directly, execute migration
if (require.main === module) {
  executeMigration()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}


