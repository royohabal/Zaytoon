---
name: Stripe Checkout return and fulfillment
description: Keep Clerk sessions intact on Stripe returns and make paid-order fulfillment resilient to browser interruptions.
---

Stripe success URLs must use the same public hostname that served the authenticated Checkout request. Clerk sessions are host-scoped, so redirecting to another Vercel alias can make a returning shopper appear signed out.

Paid-order fulfillment should be driven by a Stripe webhook with raw-body signature verification and a test/live-mode guard. A browser confirmation may remain as a secure, authenticated way to view the shopper's own order, but it must not be the only path that creates the order. Use the Stripe Checkout Session ID as the unique fulfillment key and keep stock deduction, order creation, and draft status changes in one MongoDB transaction.

**Why:** The prior return flow depended on the shopper's Clerk session surviving the Stripe redirect and on a browser request reaching MongoDB; either interruption could leave a paid session without a saved order.

**How to apply:** When changing hosted Checkout return URLs or payment fulfillment, preserve the active storefront hostname, retain Clerk ownership checks for customer-facing reads, and make webhook retries safe through the existing session-based uniqueness and transactional stock handling.
