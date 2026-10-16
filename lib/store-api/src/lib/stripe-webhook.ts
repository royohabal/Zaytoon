import type Stripe from "stripe";

export type StripeWebhookVerificationFailure =
  | "missing-secret"
  | "missing-signature"
  | "invalid-signature"
  | "live-mode-event";

export class StripeWebhookVerificationError extends Error {
  readonly reason: StripeWebhookVerificationFailure;

  constructor(reason: StripeWebhookVerificationFailure) {
    super("The Stripe webhook could not be verified.");
    this.name = "StripeWebhookVerificationError";
    this.reason = reason;
  }
}

export function constructVerifiedTestStripeEvent(
  stripe: Stripe,
  payload: Buffer,
  signature: string | undefined,
  webhookSecret: string | undefined,
): Stripe.Event {
  if (!webhookSecret) {
    throw new StripeWebhookVerificationError("missing-secret");
  }
  if (!signature) {
    throw new StripeWebhookVerificationError("missing-signature");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    throw new StripeWebhookVerificationError("invalid-signature");
  }

  if (event.livemode) {
    throw new StripeWebhookVerificationError("live-mode-event");
  }
  return event;
}
