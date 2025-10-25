import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail, sendPayoutNotificationEmail } from "@/lib/email/send";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  console.log("=== STRIPE WEBHOOK RECEIVED ===");
  console.log("Has STRIPE_WEBHOOK_SECRET:", !!process.env.STRIPE_WEBHOOK_SECRET);
  
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No stripe-signature header found");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  console.log("✅ Signature found, verifying...");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("✅ Webhook signature verified. Event type:", event.type);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("=== CHECKOUT COMPLETED WEBHOOK ===");
  console.log("Session ID:", session.id);
  console.log("Payment Intent:", session.payment_intent);
  
  const supabase = await createClient();

  const userId = session.metadata?.user_id;
  const eventId = session.metadata?.event_id;
  const photographerId = session.metadata?.photographer_id;
  const photoIds = JSON.parse(session.metadata?.photo_ids || "[]");
  const customerEmail = session.metadata?.customer_email || session.customer_email;

  console.log("Metadata:", {
    userId,
    eventId,
    photographerId,
    photoIdsCount: photoIds.length,
    customerEmail
  });

  if (!userId || !eventId || !photographerId || !photoIds.length) {
    console.error("❌ Missing metadata in checkout session");
    return;
  }

  const totalAmount = session.amount_total! / 100; // Convert from cents
  const fees = calculateFees(session.amount_total!);
  
  console.log("Amount details:", {
    totalAmount,
    platformFee: fees.platformFee / 100,
    photographerAmount: fees.photographerAmount / 100
  });

  // Create purchase record using stored function (bypasses RLS)
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

  if (purchaseError || !result || result.length === 0) {
    console.error("❌ Error creating purchase:", purchaseError);
    return;
  }

  const purchaseId = result[0].purchase_id;
  console.log("✅ Purchase created:", purchaseId);
  console.log("✅ Purchase photos linked:", photoIds.length);
  console.log("✅ Purchase completed successfully:", purchaseId);

  // Send email notifications
  try {
    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", eventId)
      .single();

    // Get photographer details
    const { data: photographer } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", photographerId)
      .single();

    // Get customer email from metadata or profile
    const customerEmail = session.metadata?.customer_email || session.customer_email;
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
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/downloads/${session.id}`;

    // Send purchase confirmation to buyer
    if (customerEmail && event) {
      console.log("Sending confirmation email to:", customerEmail);
      await sendPurchaseConfirmationEmail(
        customerEmail,
        customerName,
        event.title,
        photoIds.length,
        downloadUrl
      );
    }

    // Send payout notification to photographer
    if (photographer && event) {
      await sendPayoutNotificationEmail(
        photographer.email,
        photographer.full_name || "Fotograf",
        fees.photographerAmount / 100,
        event.title,
        photoIds.length
      );
    }
  } catch (emailError) {
    console.error("Failed to send email notifications:", emailError);
    // Don't fail the webhook if email fails
  }
}

