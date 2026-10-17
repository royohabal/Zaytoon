import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import {
  isSupportedStripeTestCurrency,
  isUnsupportedStripeCurrencyError,
} from "../src/lib/stripe.ts";
import { checkoutErrorDiagnostics } from "../src/lib/checkout-diagnostics.ts";
import {
  checkoutRequestOrigin,
  checkoutReturnUrls,
} from "../src/lib/checkout-url.ts";
import {
  constructVerifiedTestStripeEvent,
  StripeWebhookVerificationError,
} from "../src/lib/stripe-webhook.ts";

test("recognizes the account's unsupported-currency error despite its generic Error name", () => {
  const error = new Stripe.errors.StripeInvalidRequestError({
    message: "Invalid currency: kwd. Your account currently supports these currencies: usd.",
  });
  assert.equal(error.name, "Error");
  assert.equal(isUnsupportedStripeCurrencyError(error), true);
});

test("does not misclassify unrelated Stripe or application failures", () => {
  assert.equal(
    isUnsupportedStripeCurrencyError(
      new Stripe.errors.StripeInvalidRequestError({ message: "Invalid amount." }),
    ),
    false,
  );
  assert.equal(
    isUnsupportedStripeCurrencyError(new Error("Invalid currency: kwd.")),
    false,
  );
  assert.equal(isUnsupportedStripeCurrencyError(null), false);
});

test("allows USD only for new Stripe Checkout payments", () => {
  assert.equal(isSupportedStripeTestCurrency("USD"), true);
  for (const currency of ["KWD", "GBP", "EUR", "SAR"]) {
    assert.equal(isSupportedStripeTestCurrency(currency), false);
  }
});

test("diagnostics retain the Stripe type and code without raw data or sensitive values", () => {
  const fakeKey = ["sk", "test", "redaction-fixture"].join("_");
  const error = new Stripe.errors.StripeInvalidRequestError({
    message: `Invalid request. ${fakeKey} customer@example.invalid`,
    code: "parameter_invalid_integer",
  });
  error.extraPaymentData = "do-not-log";
  const fields = checkoutErrorDiagnostics(error, "create-stripe-checkout-session");
  assert.equal(fields.stripeErrorType, "StripeInvalidRequestError");
  assert.equal(fields.stripeErrorCode, "parameter_invalid_integer");
  assert.equal(fields.operation, "create-stripe-checkout-session");
  const output = JSON.stringify(fields);
  assert.ok(!output.includes(fakeKey));
  assert.ok(!output.includes("customer@example.invalid"));
  assert.ok(!output.includes("do-not-log"));
  assert.ok(!Object.hasOwn(fields, "raw"));
});

test("uses the hostname that initiated Checkout for the Stripe return URLs", () => {
  const origin = checkoutRequestOrigin({
    forwardedHost: "atelier.example, zaytoon.vercel.app",
    host: "zaytoon.vercel.app",
    forwardedProto: "https",
    production: true,
  });
  assert.equal(origin, "https://atelier.example");
  assert.deepEqual(checkoutReturnUrls(origin), {
    successUrl:
      "https://atelier.example/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://atelier.example/checkout/cancel",
  });
});

test("does not fall back to a different hostname for production Checkout", () => {
  assert.throws(
    () => checkoutRequestOrigin({ production: true }),
    /trusted Checkout request hostname/,
  );
  assert.throws(
    () =>
      checkoutRequestOrigin({
        forwardedHost: "attacker.example/path",
        production: true,
      }),
    /request host is invalid/,
  );
});

test("verifies signed test-mode Stripe events and rejects invalid or live signatures", () => {
  const stripe = new Stripe("sk_test_checkout_webhook_fixture");
  const webhookSecret = ["whsec", "test-fixture", "not-a-secret"].join("_");
  const makePayload = (livemode) =>
    JSON.stringify({
      id: "evt_test_checkout_fixture",
      object: "event",
      api_version: "2025-06-30.basil",
      created: 1_750_000_000,
      data: {
        object: {
          id: "cs_test_checkout_fixture",
          object: "checkout.session",
        },
      },
      livemode,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: "checkout.session.completed",
    });
  const sign = (payload, secret = webhookSecret) =>
    stripe.webhooks.generateTestHeaderString({ payload, secret });

  const payload = makePayload(false);
  const verified = constructVerifiedTestStripeEvent(
    stripe,
    Buffer.from(payload),
    sign(payload),
    webhookSecret,
  );
  assert.equal(verified.type, "checkout.session.completed");
  assert.equal(verified.livemode, false);

  assert.throws(
    () =>
      constructVerifiedTestStripeEvent(
        stripe,
        Buffer.from(payload),
        sign(payload, `${webhookSecret}_wrong`),
        webhookSecret,
      ),
    (error) =>
      error instanceof StripeWebhookVerificationError &&
      error.reason === "invalid-signature",
  );

  const livePayload = makePayload(true);
  assert.throws(
    () =>
      constructVerifiedTestStripeEvent(
        stripe,
        Buffer.from(livePayload),
        sign(livePayload),
        webhookSecret,
      ),
    (error) =>
      error instanceof StripeWebhookVerificationError &&
      error.reason === "live-mode-event",
  );
  assert.throws(
    () =>
      constructVerifiedTestStripeEvent(
        stripe,
        Buffer.from(payload),
        sign(payload),
        undefined,
      ),
    (error) =>
      error instanceof StripeWebhookVerificationError &&
      error.reason === "missing-secret",
  );
});
