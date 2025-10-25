import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let accountId = profile.stripe_connect_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Save Stripe Connect ID to database
      await supabase
        .from("profiles")
        .update({ stripe_connect_id: accountId })
        .eq("id", user.id);
    }

    // Create Account Link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/photographer/events`,
      return_url: `${baseUrl}/photographer/events`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe Connect account" },
      { status: 500 }
    );
  }
}

// Check Stripe Connect status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_connect_id) {
      return NextResponse.json({ connected: false, charges_enabled: false });
    }

    // Check account status
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);

    return NextResponse.json({
      connected: true,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (error: any) {
    console.error("Stripe status check error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

