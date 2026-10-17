import Stripe from "stripe";
import type { CurrencyCode } from "@workspace/api-zod";

// Checkout is USD-only. Keep old currency values readable for historical
// records, but reject them for new test payments.
export function isSupportedStripeTestCurrency(currency: CurrencyCode): boolean {
  return currency === "USD";
}

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigurationError";
  }
}

export function isUnsupportedStripeCurrencyError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    /^Invalid currency:/i.test(error.message)
  );
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
