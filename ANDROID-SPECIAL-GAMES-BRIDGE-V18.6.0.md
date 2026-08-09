# PRIMY Web v18.6.0 — Android Special Games Bridge

The web client remains the complete reference implementation and now explicitly validates the Android 19.2.0-beta2 payload contract for all special-game families.

## Android-compatible special payloads
- Lotería Nacional: `nationalNumber`, `ticketQuantity`, price, series/fraction and frozen draw date.
- Quiniela: official `roundId`, revision, source hash, 14 signs and Pleno al 15.
- Quinigol: official `roundId`, revision, source hash and six 0/1/2/M score buckets.
- Lototurf: official round identity, numbers and horse selection.
- Quíntuple Plus: official round identity and six selection rows.

The existing web sanitizers remain authoritative and reject malformed special-game records. The unified verification layer rejects a different official date or round before payout evaluation.

## Account policy
Public account registration stays disabled in the web client. `VITE_WEB_TEST_EMAIL` can restrict login to the designated web test account. Android registration remains independent and enabled.
