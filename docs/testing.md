# Testing

## Unit tests
Run all unit tests:

```bash
npm test
```

## Live integration tests (opt-in)

```bash
KRS_LIVE_TESTS=1 npm run test:live
```

Live tests call external government APIs and can fail due to network or service downtime.

## Validation order before handoff
1. `npm run lint`
2. `npm run typecheck`
3. `npm test`

`test:live` is manual and not part of default CI.
