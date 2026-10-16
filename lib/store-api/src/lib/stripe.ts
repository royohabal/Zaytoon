import Stripe from "stripe";

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigurationError";
  }
}

export function getTestStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeConfigurationError(
      "Stripe Checkout is not configured. Set STRIPE_SECRET_KEY.",
    );
  }
  if (!secretKey.startsWith("sk_test_")) {
    throw new StripeConfigurationError(
      "Stripe Checkout is test-only. Configure a Stripe test secret key.",
    );
  }
  return new Stripe(secretKey);
}
