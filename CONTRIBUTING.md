# Contributing

## Development flow
1. Create a branch (`codex/<type>/<scope>`).
2. Implement changes with tests.
3. Run required checks:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
4. Open PR.

## Live tests
Live integration tests are opt-in and run manually with:

```bash
KRS_LIVE_TESTS=1 npm run test:live
```
