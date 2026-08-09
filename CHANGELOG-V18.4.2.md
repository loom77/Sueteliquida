# PRIMY v18.4.2 — Account Bridge

- Adds a permanent account-deletion control to the web profile.
- Adds the `delete-account` Supabase Edge Function. The user JWT is verified before an admin deletion is performed server-side.
- No service-role credential is exposed to web or Android clients.
- Keeps the v18.4.1 unsaved-generation guard and v18.4.0 frozen-draw contract unchanged.
- Provides backend parity required by Android 19.0.0-alpha2.
