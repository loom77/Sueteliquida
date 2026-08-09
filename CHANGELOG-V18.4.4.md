# PRIMY v18.4.4 — Verification Date Lock

- Strengthens the immutable draw contract introduced in v18.4.0.
- A stored play can only be settled against official data whose date matches `drawDateKey`.
- Sports/horse rounds are also protected against a mismatching `roundId` when both identifiers are present.
- Web registration remains closed; existing test login remains available.
- This release is the web counterpart of Android 19.0.0-alpha4 Official Verification.
