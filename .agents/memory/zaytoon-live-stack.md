---
name: Zaytoon live stack
description: Preserve the store's current database, authentication, and authoritative product catalog.
---

Keep Zaytoon on its existing MongoDB Atlas/native-driver and Clerk implementation. Do not migrate it to Mongoose, JWT auth, PostgreSQL, or Replit-managed auth unless the user explicitly requests a migration.

Use the MongoDB product catalog as the trusted pricing source for Checkout. Compute amounts server-side from the stored product price and the selected currency's current exchange rate; do not require a duplicate product catalog in Stripe.

**Why:** The user explicitly confirmed preserving MongoDB and Clerk when the project's older Day 5 guidance described another stack, and asked that checkout use existing trusted product data.

**How to apply:** When working on this storefront, inspect the live implementation and follow the user's preservation requirement over mismatched starter templates. Keep Stripe secrets server-side and test-only unless the user authorizes a change.
