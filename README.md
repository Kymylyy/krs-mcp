# krs-mcp

TypeScript SDK + MCP server do pracy z publicznymi danymi KRS (API oficjalne, wyszukiwarka, TERYT, RDN).

Krótki opis repo (np. do ustawienia na GitHub):  
`MCP server and TypeScript SDK for Polish KRS data sources (official API, search API, TERYT, RDN).`

## Zakres
- API oficjalne KRS: odpisy + biuletyny zmian.
- API wyszukiwarki: wyszukiwanie i szczegóły podmiotu (w tym skład zarządu).
- RDN: pobieranie danych dłużnika.
- TERYT basic + advanced: słowniki i walidacja adresów.
- Serwer MCP z 16 narzędziami.

## Wymagania
- Node.js `>=20`
- `npm`

## Szybki start

```bash
npm install
npm run build
npm run start
```

Tryb developerski (bez builda):

```bash
npm run dev
```

## Użycie jako biblioteka

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

## Integracja MCP (stdio)
Po `npm run build` uruchamialny entrypoint to `dist/mcp/index.js`.

Przykładowa konfiguracja MCP:

```json
{
  "mcpServers": {
    "krs": {
      "command": "node",
      "args": ["/absolute/path/to/krs-mcp/dist/mcp/index.js"]
    }
  }
}
```

## Narzędzia MCP
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

### Uwaga: TERYT
- `list_counties`, `list_municipalities`, `list_localities` działają jako endpointy dokładnego dopasowania.
- Dla tych narzędzi podawaj pełne wartości filtrów (`county`, `municipality`, `locality`), inaczej upstream może zwracać `404`.
- Endpointy TERYT advanced (`suggest_*`, `lookup_admin_by_city`, `validate_address`) mogą okresowo zwracać `503` po stronie zewnętrznej.

## Konfiguracja
`createKrsClient()` przyjmuje częściowy `KrsConfig` (base URL-e, timeout, rate-limit, własny `fetch`).

Serwer MCP czyta też zmienne środowiskowe:
- `KRS_OFFICIAL_API_BASE_URL`
- `KRS_WYSZUKIWARKA_BASE_URL`
- `KRS_TERYT_ADVANCED_BASE_URL`
- `KRS_API_KEY_HEADER`
- `KRS_SECRET_KEY`
- `KRS_TIMEOUT_MS`
- `KRS_RATE_LIMIT_PER_SECOND`

Domyślnie:
- timeout: `15000ms`
- rate limit: `2 req/s` per host
- retry: `401 x1` (endpointy auth), `5xx/network x2` (backoff)

## Jakość i testy

```bash
npm run lint
npm run typecheck
npm test
KRS_LIVE_TESTS=1 npm run test:live
```

`test:live` jest opcjonalny i zależy od dostępności zewnętrznych API.

## Dokumentacja
- `docs/endpoint-contracts.md`
- `docs/errors.md`
- `docs/testing.md`
- `docs/privacy.md`
- `CONTRIBUTING.md`
