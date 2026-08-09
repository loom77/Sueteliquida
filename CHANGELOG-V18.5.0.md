# PRIMY Web v18.5.0 — Android Numeric Games Beta Bridge

- Data contract advanced to 18.5.0.
- Web remains login-only: public account creation stays disabled.
- Android account creation remains independent and enabled.
- Added explicit bridge coverage for Android Euromillones, El Gordo and EuroDreams plays.
- Euromillones preserves `secondaryNumbers` per column.
- El Gordo preserves per-column Clave without converting it into receipt reintegro.
- EuroDreams preserves per-column Sueño and deferred top prizes are not counted as cash.
- Existing exact-draw verification lock remains active.
- Web test suite: 292/292 passed.
- Release guard: passed.
