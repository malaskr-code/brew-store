---
name: Proxied preview compatibility
description: Verify framework development loaders on the actual Replit preview host, not only loopback.
---

Check the real proxied preview hostname as well as the local screenshot target
after changing the web framework or development server.

**Why:** During the Next.js migration, a working loopback screenshot did not
prove the public preview worked. An origin-restricted development connection
could leave the entire client-rendered store blank without a visible UI error.

**How to apply:** Confirm the framework's development resource connections work
through the actual preview host before treating a local capture as sufficient
evidence. Keep development-origin permissions narrow; nested subdomains may not
match a single-label wildcard.

Do not treat a framework's initial “Ready” log as proof the server stayed alive.

**Why:** Next.js can print its listening address and then stop with a security
upgrade warning and a nonzero exit status.

**How to apply:** Check the final workflow state and an actual HTTP response.
When a security check causes the exit, use a compatible patched framework
release rather than bypassing the check or changing working port settings.
