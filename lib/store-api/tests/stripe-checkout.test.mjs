import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { isUnsupportedStripeCurrencyError } from "../src/lib/stripe.ts";
import { checkoutErrorDiagnostics } from "../src/lib/checkout-diagnostics.ts";

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
