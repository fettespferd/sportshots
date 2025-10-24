import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { photoIds, eventId, guestEmail } = await request.json();

    // Allow both authenticated users and guests (with email)
    if (!user && !guestEmail) {
      return NextResponse.json(
        { error: "Please provide your email address" },
        { status: 400 }
      );
    }

    const customerEmail = user?.email || guestEmail;

    if (!photoIds || photoIds.length === 0) {
      return NextResponse.json(
        { error: "No photos selected" },
        { status: 400 }
      );
    }

    // Get photos and event details
    const { data: photos } = await supabase
      .from("photos")
      .select("*, event:event_id(photographer_id)")
      .in("id", photoIds);

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "Photos not found" }, { status: 404 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("*, profiles:photographer_id(stripe_connect_id)")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate total amount (in cents)
    const totalAmount = photos.reduce((sum, photo) => sum + Number(photo.price), 0);
    const totalInCents = Math.round(totalAmount * 100);

    // Calculate fees
    const fees = calculateFees(totalInCents);

    // Get photographer's Stripe Connect account
    const photographerStripeId = (event.profiles as any)?.stripe_connect_id;

    if (!photographerStripeId) {
      return NextResponse.json(
        { error: "Photographer hasn't set up payments yet" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session with Connect
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: photos.map((photo) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Foto vom ${event.title}`,
            images: [photo.watermark_url],
          },
          unit_amount: Math.round(Number(photo.price) * 100),
        },
        quantity: 1,
      })),
      payment_intent_data: {
        application_fee_amount: fees.platformFee,
        transfer_data: {
          destination: photographerStripeId,
        },
        metadata: {
          user_id: user?.id || "guest",
          event_id: eventId,
          photographer_id: event.photographer_id,
          photo_ids: JSON.stringify(photoIds),
          customer_email: customerEmail,
        },
      },
      customer_email: customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.slug}`,
      metadata: {
        user_id: user?.id || "guest",
        event_id: eventId,
        photographer_id: event.photographer_id,
        photo_ids: JSON.stringify(photoIds),
        customer_email: customerEmail,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

