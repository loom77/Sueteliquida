# Android Bonoloto bridge — Web v18.4.5

Android 19.0.0-alpha5 adds native Bonoloto simple bets. This web release validates the shared `primy_plays` contract.

Expected Android draft:
- `gameId = bonoloto`
- 2–8 simple columns
- `costCents = columns * 50`
- `receiptExtra = null` until the real receipt is registered
- frozen `drawDateKey` / draw timestamps
- `metadata.androidClientVersion = 19.0.0-alpha5`

A purchased Bonoloto must contain a valid 0–9 receipt reintegro. The web sanitizer intentionally rejects purchased records without it.
