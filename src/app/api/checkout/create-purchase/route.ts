import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail, sendPayoutNotificationEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    console.log("=== MANUAL PURCHASE CREATION ===");
    console.log("Session ID:", sessionId);

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log("Stripe session retrieved:", {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if purchase already exists
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existingPurchase) {
      console.log("✅ Purchase already exists:", existingPurchase.id);
      return NextResponse.json({ 
        success: true, 
        purchaseId: existingPurchase.id,
        alreadyExists: true 
      });
    }

    // Extract metadata
    const userId = session.metadata?.user_id;
    const eventId = session.metadata?.event_id;
    const photographerId = session.metadata?.photographer_id;
    const photoIds = JSON.parse(session.metadata?.photo_ids || "[]");
    const customerEmail = session.metadata?.customer_email || session.customer_email;

    console.log("Metadata extracted:", {
      userId,
      eventId,
      photographerId,
      photoIdsCount: photoIds.length,
      customerEmail
    });

    if (!userId || !eventId || !photographerId || !photoIds.length) {
      console.error("❌ Missing metadata");
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    const totalAmount = session.amount_total! / 100;
    const fees = calculateFees(session.amount_total!);

    console.log("Creating purchase in database using stored function...");

    // Use stored function to create purchase and link photos (bypasses RLS)
    const { data: result, error: purchaseError } = await supabase.rpc(
      "create_purchase_with_photos",
      {
        p_buyer_id: userId === "guest" ? null : userId,
        p_event_id: eventId,
        p_photographer_id: photographerId,
        p_stripe_payment_intent_id: session.payment_intent as string,
        p_stripe_session_id: session.id,
        p_total_amount: totalAmount,
        p_platform_fee: fees.platformFee / 100,
        p_photographer_amount: fees.photographerAmount / 100,
        p_photo_ids: photoIds,
        p_customer_email: customerEmail,
        p_status: "completed",
      }
    );

    if (purchaseError) {
      console.error("❌ Error creating purchase:", purchaseError);
      return NextResponse.json(
        { error: "Failed to create purchase", details: purchaseError },
        { status: 500 }
      );
    }

    if (!result || result.length === 0) {
      console.error("❌ No result from create_purchase_with_photos");
      return NextResponse.json(
        { error: "Failed to create purchase" },
        { status: 500 }
      );
    }

    const purchaseId = result[0].purchase_id;
    console.log("✅ Purchase created:", purchaseId);
    console.log("✅ Purchase photos linked:", photoIds.length);

    // Send email notifications
    console.log("📧 Starting email notification process...");
    try {
      // Get event details
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("title")
        .eq("id", eventId)
        .single();

      if (eventError) {
        console.error("❌ Error fetching event for email:", eventError);
      }

      // Get photographer details
      const { data: photographer, error: photographerError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", photographerId)
        .single();

      if (photographerError) {
        console.error("❌ Error fetching photographer for email:", photographerError);
      }

      let customerName = "Kunde";
      
      if (userId && userId !== "guest") {
        const { data: buyer } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        customerName = buyer?.full_name || "Kunde";
      }

      // Create download URL
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/downloads/${sessionId}`;

      console.log("📧 Email data prepared:", {
        customerEmail,
        customerName,
        eventTitle: event?.title,
        photoCount: photoIds.length,
        downloadUrl,
        photographerEmail: photographer?.email,
      });

      // Send purchase confirmation to buyer
      if (customerEmail && event) {
        console.log("📧 Sending confirmation email to:", customerEmail);
        const result = await sendPurchaseConfirmationEmail(
          customerEmail,
          customerName,
          event.title,
          photoIds.length,
          downloadUrl
        );
        console.log("📧 Purchase confirmation result:", result);
      } else {
        console.warn("⚠️ Skipping purchase confirmation email:", {
          hasCustomerEmail: !!customerEmail,
          hasEvent: !!event,
        });
      }

      // Send payout notification to photographer
      if (photographer && event) {
        console.log("📧 Sending payout notification to:", photographer.email);
        const result = await sendPayoutNotificationEmail(
          photographer.email,
          photographer.full_name || "Fotograf",
          fees.photographerAmount / 100,
          event.title,
          photoIds.length
        );
        console.log("📧 Payout notification result:", result);
      }
      
      console.log("✅ Email notifications completed");
    } catch (emailError) {
      console.error("❌ Failed to send email notifications:", emailError);
      console.error("❌ Email error stack:", emailError instanceof Error ? emailError.stack : emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      purchaseId: purchaseId 
    });
  } catch (error: any) {
    console.error("❌ Manual purchase creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase" },
      { status: 500 }
    );
  }
}

