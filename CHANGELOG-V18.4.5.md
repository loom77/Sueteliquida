# PRIMY Web v18.4.5 — Android Bonoloto Bridge

- Release bumped to 18.4.5.
- Web registration remains disabled; existing test login remains available.
- Added Web/Android contract regression coverage for Bonoloto alpha5.
- Web accepts Android Bonoloto drafts with `receiptExtra: null` without inventing a reintegro.
- Web rejects a Bonoloto play marked as purchased if the real receipt reintegro is missing.
- Exact-date verification lock is explicitly covered for Bonoloto as well as La Primitiva.
- Data contract remains `18.4.0`; no incompatible schema migration is introduced.
