# Deploy handoff — PRIMY v18.4.1

1. Replace repository contents with the complete package or apply the patch-only files.
2. Run `npm install`.
3. Run `npm run release:check`.
4. Deploy to Vercel.
5. Manual smoke test:
   - generate a play;
   - do not save it;
   - tap Inicio or Archivo;
   - verify the loss warning appears;
   - cancel and verify numbers remain;
   - repeat, confirm loss and verify navigation succeeds;
   - generate again, save draft, navigate away and verify no warning;
   - test browser Back and page refresh.
