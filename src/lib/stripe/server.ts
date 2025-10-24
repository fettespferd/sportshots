import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2025-09-30.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripe = getStripe();
    return (stripe as any)[prop];
  }
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

