# krs-mcp

TypeScript standalone library + MCP server for Polish KRS data sources.

## Features
- Official KRS API support (extracts + bulletins).
- Wyszukiwarka API support (including unmasked board members).
- RDN debtor endpoint support.
- TERYT basic + advanced endpoint wrappers.
- MCP server exposing 16 tools.

## Requirements
- Node.js >= 20
- npm

## Install

```bash
npm install
```

## Scripts

```bash
npm run build
npm run dev
npm run start
npm run lint
npm run typecheck
npm test
KRS_LIVE_TESTS=1 npm run test:live
```

## Standalone library usage

```ts
import {
  createKrsClient,
  searchEntities,
  getEntityDetails,
  getEntityExtract,
  getEntityBoard,
  getRegistryChanges,
  getRegistryStats,
  getDebtorDetails,
  listVoivodeships,
  listCounties,
  listMunicipalities,
  listLocalities,
  suggestCities,
  suggestStreets,
  suggestPostalCodes,
  lookupAdminByCity,
  validateAddress
} from "krs-mcp";

const client = createKrsClient();
const search = await searchEntities(client, { name: "POLSKIE KOLEJE", limit: 5 });
const details = await getEntityDetails(client, "19193");
```

## MCP tools
1. `search_entities`
2. `get_entity_details`
3. `get_entity_extract`
4. `get_entity_board`
5. `get_registry_changes`
6. `registry_stats`
7. `get_debtor_details`
8. `list_voivodeships`
9. `list_counties`
10. `list_municipalities`
11. `list_localities`
12. `suggest_cities`
13. `suggest_streets`
14. `suggest_postal_codes`
15. `lookup_admin_by_city`
16. `validate_address`

## Run MCP server

```bash
npm run build
npm run start
```

Or during development:

```bash
npm run dev
```

## Configuration
`createKrsClient()` accepts partial `KrsConfig` for endpoint URLs, timeout, rate-limit and `fetch` implementation.

Defaults:
- timeout: `15000ms`
- rate-limit: `2 req/s per host`
- retry: `401 x1` (auth endpoints), `5xx/network x2` with backoff

## Docs
- `docs/endpoint-contracts.md`
- `docs/errors.md`
- `docs/testing.md`
- `docs/privacy.md`
