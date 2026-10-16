---
name: Stripe payment currency support
description: Display currencies are not necessarily chargeable by the configured Stripe account.
---

Do not assume that a currency supported by Zaytoon's price display can also be charged through its Stripe account. Do not silently change a customer's payment currency.

**Why:** Test-session creation with the configured test account accepted USD, GBP, EUR, and SAR but rejected KWD with Stripe's "Invalid currency: kwd" error. The SDK left `error.name` as `Error`; its Stripe-specific type identified the invalid request.

**How to apply:** Preserve KWD price display, but let customers explicitly choose a supported payment currency and review the updated total before retrying. Recheck Stripe's actual currency capabilities when account settings or credentials change; this limitation belongs to the configured account, not necessarily every Stripe account.
