---
name: Payment currency compatibility
description: Check the connected payment account's actual presentment currencies, not only currency precision.
---

Verify the payment account's supported charge currencies before assuming the
store's display currency can be used for checkout. Ask the user before changing
the charge currency; a currency switcher is not permission to change settlement
or checkout behavior.

For Brew, keep catalog/display prices in KWD and use USD for **Stripe test
checkout only**, with the exact server-calculated USD total shown for confirmation
before redirecting to Stripe.

**Why:** The user explicitly approved USD test checkout after the connected
Stripe account rejected KWD.

**How to apply:** Preserve that visible confirmation and currency distinction.
Do not enable live payments or change the charge currency without new approval.

**Why:** Stripe accepted a valid test key but rejected KWD when creating a price.
Correct three-decimal amount handling alone did not make KWD available.

**How to apply:** Check current provider capabilities and actual API responses.
Do not assume adding a bank account will enable a currency, and do not silently
fall back to USD when the storefront promises KWD charges.
