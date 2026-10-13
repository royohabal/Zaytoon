---
name: Vite dependency cache
description: Diagnosing runtime React mismatches when installed package versions already match.
---

A workflow restart may retain stale Vite optimized dependencies after React package versions change. Matching manifests and installed packages do not prove the browser is running those versions.

**Why:** The preview continued to run an older React renderer after both installed React packages matched. Restarting alone retained the optimized bundle; forced reoptimization restored a working preview.

**How to apply:** If React reports a version mismatch despite matching package resolution, inspect the optimized bundle's runtime version and force Vite dependency reoptimization before changing authentication or application code.
