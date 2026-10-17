---
name: Storefront currency policy
description: The storefront and new Checkout requests use USD only; legacy orders may contain historical display-currency snapshots.
---

The Zaytoon storefront displays prices and accepts new orders only in USD. Existing order records may retain historical display-currency fields; do not rewrite those records. For order history, use the stored base `total` (USD) instead of the older converted display total.

**Why:** The configured Stripe test account rejected KWD, and the user chose to remove currency switching rather than risk a displayed payment currency that the store cannot accept.

**How to apply:** Keep product, cart, order, and Checkout UI fixed to USD; reject non-USD values in server-side order and Checkout routes. Retain broad currency types only where needed to read legacy order records.
