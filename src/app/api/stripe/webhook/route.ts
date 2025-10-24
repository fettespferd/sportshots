import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail, sendPayoutNotificationEmail } from "@/lib/email/send";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
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
  const supabase = await createClient();

  const userId = session.metadata?.user_id;
  const eventId = session.metadata?.event_id;
  const photographerId = session.metadata?.photographer_id;
  const photoIds = JSON.parse(session.metadata?.photo_ids || "[]");

  if (!userId || !eventId || !photographerId || !photoIds.length) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const totalAmount = session.amount_total! / 100; // Convert from cents
  const fees = calculateFees(session.amount_total!);

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      buyer_id: userId === "guest" ? null : userId,
      event_id: eventId,
      photographer_id: photographerId,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
      total_amount: totalAmount,
      platform_fee: fees.platformFee / 100,
      photographer_amount: fees.photographerAmount / 100,
      photo_ids: photoIds,
      status: "completed",
      completed_at: new Date().toISOString(),
      metadata: {
        customer_email: session.metadata?.customer_email || session.customer_email,
      },
    })
    .select()
    .single();

  if (purchaseError) {
    console.error("Error creating purchase:", purchaseError);
    return;
  }

  // Create purchase_photos records
  const purchasePhotos = photoIds.map((photoId: string) => ({
    purchase_id: purchase.id,
    photo_id: photoId,
  }));

  const { error: junctionError } = await supabase
    .from("purchase_photos")
    .insert(purchasePhotos);

  if (junctionError) {
    console.error("Error creating purchase_photos:", junctionError);
  }

  console.log("Purchase created successfully:", purchase.id);

  // Send email notifications
  try {
    // Get buyer details
    const { data: buyer } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

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

    // Get photo URLs for download links
    const { data: photos } = await supabase
      .from("photos")
      .select("original_url")
      .in("id", photoIds);

    const downloadLinks = photos?.map((photo) => photo.original_url) || [];

    // Send purchase confirmation to buyer
    if (buyer && event) {
      await sendPurchaseConfirmationEmail(
        buyer.email,
        buyer.full_name || "Kunde",
        event.title,
        photoIds.length,
        totalAmount,
        downloadLinks
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

