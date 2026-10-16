import type { Request, Response } from "express";
import type Stripe from "stripe";
import { checkoutErrorDiagnostics } from "../lib/checkout-diagnostics";
import { MongoConfigurationError } from "../lib/mongodb";
import {
  CheckoutConfirmationError,
  CheckoutStockError,
  fulfillPaidCheckoutSession,
  refundUnavailablePaidCheckout,
} from "./checkout";
import { getTestStripeClient } from "../lib/stripe";
import {
  constructVerifiedTestStripeEvent,
  StripeWebhookVerificationError,
} from "../lib/stripe-webhook";

const handledEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: "A signed Stripe event body is required." });
    return;
  }

  let stripe: Stripe;
  try {
    stripe = getTestStripeClient();
  } catch {
    req.log.error({ kind: "stripe-test-configuration" }, "Stripe webhook unavailable");
    res.status(503).json({ error: "Stripe webhook processing is not configured." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = constructVerifiedTestStripeEvent(
      stripe,
      req.body,
      req.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    if (error instanceof StripeWebhookVerificationError) {
      if (error.reason === "missing-secret") {
        req.log.error({ kind: error.reason }, "Stripe webhook signing secret is missing");
        res.status(503).json({ error: "Stripe webhook processing is not configured." });
      } else {
        req.log.warn({ kind: error.reason }, "Stripe webhook request was rejected");
        res.status(400).json({ error: "The Stripe webhook signature is invalid." });
      }
      return;
    }
    req.log.error(
      checkoutErrorDiagnostics(error, "verify-stripe-webhook"),
      "Stripe webhook verification failed",
    );
    res.status(400).json({ error: "The Stripe webhook signature is invalid." });
    return;
  }

  if (!handledEventTypes.has(event.type)) {
    res.status(200).json({ received: true });
    return;
  }

  const eventSession = event.data.object as Stripe.Checkout.Session;
  if (!eventSession.id.startsWith("cs_test_")) {
    res.status(400).json({ error: "Only test-mode Checkout Sessions are accepted." });
    return;
  }

  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await stripe.checkout.sessions.retrieve(eventSession.id, {
      expand: ["payment_intent"],
    });
    if (session.status !== "complete" || session.payment_status !== "paid") {
      if (event.type === "checkout.session.completed") {
        res.status(200).json({ received: true });
        return;
      }
      throw new Error("Stripe reported payment success before the session was paid.");
    }

    await fulfillPaidCheckoutSession(session);
    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof CheckoutStockError && session) {
      try {
        await refundUnavailablePaidCheckout(session);
        req.log.warn(
          { outcome: "refunded-unavailable-stock" },
          "Paid Checkout could not be fulfilled because stock changed",
        );
        res.status(200).json({ received: true });
      } catch (refundError) {
        req.log.error(
          checkoutErrorDiagnostics(refundError, "refund-unavailable-webhook-checkout"),
          "Stripe webhook could not refund an unavailable item",
        );
        res.status(500).json({ error: "Checkout fulfillment needs to be retried." });
      }
      return;
    }

    req.log.error(
      error instanceof MongoConfigurationError
        ? { operation: "fulfill-stripe-webhook", kind: "mongodb-unavailable" }
        : checkoutErrorDiagnostics(
            error,
            error instanceof CheckoutConfirmationError
              ? "verify-webhook-checkout"
              : "fulfill-webhook-checkout",
          ),
      "Stripe webhook could not fulfill the paid Checkout Session",
    );
    res.status(500).json({ error: "Checkout fulfillment needs to be retried." });
  }
}
