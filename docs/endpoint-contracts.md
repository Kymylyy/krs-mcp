# KRS Endpoint Contracts

## Sources
- Functional specification: `KRS_MCP_SPEC.md` (snapshot 2026-02-28).
- Public frontend bundle: `https://wyszukiwarka-krs.ms.gov.pl/main.107201e5e6b95da7.js`.
- Frontend runtime env: `https://wyszukiwarka-krs.ms.gov.pl/assets/env.js`.

## Base URLs
- Official API: `https://api-krs.ms.gov.pl/api/krs/`.
- Wyszukiwarka API: `https://wyszukiwarka-krs-api.ms.gov.pl/api/wyszukiwarka/`.
- Advanced TERYT API: `https://wyszukiwarka-krs.ms.gov.pl/api/terytwkrs/Teryt/`.

## Authentication
### Wyszukiwarka + TERYT basic
Headers required:
- `Content-Type: application/json`
- `apiKey: <generated 512-digit token>`
- `x-api-key: TopSecretApiKey`

### Official API
No auth.

### TERYT advanced
Observed from frontend calls as plain GET/POST without custom auth headers.

## Official API (GET)
- `OdpisAktualny/{krs}?rejestr={P|S}&format=json`
- `OdpisPelny/{krs}?rejestr={P|S}&format=json`
- `Biuletyn/{date}` (`YYYY-MM-DD`, date >= `2021-12-08`)
- `BiuletynGodzinowy/{date}?godzinaOd={0-23}&godzinaDo={0-23}`

## Wyszukiwarka API (POST)
- `krs`
- `danepodmiotu` (`{ krs: <AES-base64> }`)
- `odpisaktualny`
- `odpispelny`
- `OdpisAktualny/pdf`
- `OdpisPelny/pdf`
- `danerdn` (`{ rdn: <AES-base64> }`)

## TERYT basic (POST under `/api/wyszukiwarka/`)
- `Wojewodztwa` body: `{ "teryt": false, "wojewodztwo": "<query>" }`
- `Powiaty` body: `{ "teryt": false, "wojewodztwo": "<woj>", "powiat": "<query>" }`
- `Gminy` body: `{ "teryt": false, "wojewodztwo": "<woj>", "powiat": "<pow>", "gmina": "<query>" }`
- `Miejscowosci` body: `{ "teryt": false, "wojewodztwo": "<woj>", "powiat": "<pow>", "gmina": "<gm>", "miejscowosc": "<query>" }`

## TERYT advanced (`/api/terytwkrs/Teryt/`)
- `GET GetCities` params: `Miejscowosc`, optional `Wojewodztwo`, `Powiat`, `Gmina`
- `GET GetStreets` params: `Ulica`, optional `Wojewodztwo`, `Powiat`, `Gmina`, `Miejscowosc`
- `GET GetPostalCodes` params: `Miejscowosc`, optional `Ulica`
- `POST DajListeAdm` body variants:
  - `{ "kategoria": "województwo" }`
  - `{ "kategoria": "powiat", "twardyFiltr": { "wojewodztwo": "..." } }`
  - `{ "kategoria": "gmina", "twardyFiltr": { "wojewodztwo": "...", "powiat": "..." } }`
- `GET DajAdmPoMiasto` params: `city`
- `POST CheckAdress` body: address object (frontend-dependent)

## Status handling
- 200: success
- 204: no content / deregistered entity (`odpisaktualny`)
- 400: validation error
- 401: invalid/expired generated token
- 404: not found
- 5xx: upstream instability
