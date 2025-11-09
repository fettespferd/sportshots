import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: "Missing Supabase credentials",
          message: "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
        },
        { status: 500 }
      );
    }

    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      "src/supabase/migrations/20250130000000_add_edited_photos.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: "Migration file not found" },
        { status: 404 }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🚀 Executing migration: Add edited photos support...");

    // Execute migration via Supabase Management API
    // We'll use the REST API to execute SQL statements
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];

    // Execute each statement via REST API
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Use Supabase REST API to execute SQL
          // Since Supabase doesn't support direct SQL execution via REST API,
          // we need to use the Management API or execute via a helper function
          
          // Try executing via RPC if a helper function exists
          // Otherwise, we'll need to execute manually
          
          // For now, we'll return the SQL for manual execution
          // but log that we're trying to execute
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          results.push({ 
            statement: statement.substring(0, 50) + '...', 
            status: 'pending' 
          });
        } catch (error: any) {
          results.push({ 
            statement: statement.substring(0, 50) + '...', 
            status: 'error', 
            error: error.message 
          });
        }
      }
    }

    // Since Supabase JS doesn't support direct SQL execution,
    // we need to execute via Management API or manually
    // Return instructions for manual execution
    return NextResponse.json({
      success: false,
      message: "Direct SQL execution not available via Supabase JS Client",
      migration: migrationSQL,
      instructions: [
        "1. Go to Supabase Dashboard → SQL Editor",
        "2. Create a new query",
        "3. Copy and paste the migration SQL below",
        "4. Click 'Run' to execute"
      ],
      note: "Please execute the migration manually via SQL Editor or use Supabase CLI: supabase db push"
    });

  } catch (error: any) {
    console.error("Migration error:", error);
    
    const migrationPath = path.join(
      process.cwd(),
      "src/supabase/migrations/20250130000000_add_edited_photos.sql"
    );
    
    let migrationSQL = "";
    if (fs.existsSync(migrationPath)) {
      migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      migration: migrationSQL,
      instructions: [
        "1. Go to Supabase Dashboard → SQL Editor",
        "2. Create a new query",
        "3. Copy and paste the migration SQL",
        "4. Click 'Run' to execute"
      ]
    }, { status: 500 });
  }
}
