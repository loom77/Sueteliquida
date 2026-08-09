# Mobile readiness contract — v18.7.0

Android calls `GET /api/mobile-config` to discover the currently deployed compatibility contract.

Required values for Android 19.3.0-beta3:
- API contract: `1.0`
- play data contract: `18.7.0`
- all ten game IDs present
- `androidSignup: true`
- `webSignup: false`
- exact-event verification enabled

The Android background worker checks this contract before applying automatic verification writes. A deployed backend with an incompatible contract therefore cannot silently mutate archive verification data in the beta3 background path.
