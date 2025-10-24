import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

export const PLATFORM_FEE_PERCENTAGE = 
  parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "15") / 100;

export function calculateFees(amount: number) {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE);
  const photographerAmount = amount - platformFee;

  return {
    total: amount,
    platformFee,
    photographerAmount,
  };
}

