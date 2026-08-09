# PRIMY Web v18.4.2 — final validation

- Version: 18.4.2
- Node tests: 281 passed, 0 failed
- Release guard: passed
- Account deletion UI added to Profile > Datos y ajustes avanzados
- Public account-deletion information page added
- `delete-account` Supabase Edge Function source added
- Client source contains no service-role credential
- v18.4.1 unsaved-generation guard retained
- v18.4.0 selected-draw verification contract retained

Build limitation: `npm run build` cannot execute in this workspace because the `vite` binary is not installed. Run `npm install && npm run release:check` in deploy/CI.
