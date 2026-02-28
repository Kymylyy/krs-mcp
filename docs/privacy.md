# Privacy and Logging

## Data categories
The service can access public but personal data (full board member names) via `danepodmiotu` and potentially debtor-related data via `danerdn`.

## Logging rules
- Do not log full payloads from `danepodmiotu` or `danerdn` in production.
- Log only operational metadata by default:
  - endpoint name
  - request duration
  - status code
  - normalized KRS/RDN identifier
- Never log generated `apiKey` token values.

## Storage
- No persistent cache is implemented in v1.
- In-memory values exist only during request processing.

## Security notes
- `x-api-key` and AES key values are public in client bundles; treat them as protocol constants, not secrets.
- Keep configurable via runtime config for compatibility.
