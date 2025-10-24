import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Get purchase by session ID (token)
    const { data: purchase, error } = await supabase
      .from("purchases")
      .select(`
        *,
        purchase_photos (
          photo_id,
          photos (
            id,
            original_url,
            event_id,
            events (
              title
            )
          )
        )
      `)
      .eq("stripe_session_id", token)
      .eq("status", "completed")
      .single();

    if (error || !purchase) {
      return NextResponse.json(
        { error: "Purchase not found or not completed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        created_at: purchase.created_at,
        total_amount: purchase.total_amount,
        customer_email: purchase.metadata?.customer_email || purchase.user_id,
        photos: purchase.purchase_photos.map((pp: any) => ({
          id: pp.photos.id,
          original_url: pp.photos.original_url,
          event_title: pp.photos.events?.title,
        })),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to load downloads" },
      { status: 500 }
    );
  }
}

