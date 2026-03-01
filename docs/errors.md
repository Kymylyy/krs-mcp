# Error Mapping

## Domain errors
- `KrsValidationError`: input validation failed before upstream request.
- `KrsNetworkError`: network, timeout, DNS or transport-level failure.
- `KrsApiError`: non-auth HTTP error from upstream.
- `KrsAuthError`: 401 from auth-protected endpoint.

## MCP output behavior
All tool errors are rendered as text via `formatErrorMessage(error)`:
- Validation: `Invalid input: ...`
- Auth: `Authentication failed (401): ...`
- API: `Upstream API error (status): ...`
- Network: `Network error: ...`

### TERYT-specific behavior
- TERYT basic exact-match endpoints can return `404` for broad/empty filters. The library remaps this to `KrsValidationError` with guidance to provide exact values.
- TERYT advanced endpoints can return `503` when upstream is unavailable. The library preserves `KrsApiError(503)` with a clearer message: `TERYT advanced service is temporarily unavailable`.

## Retry policy
- 401 (`wyszukiwarka` and TERYT basic): one retry with regenerated `apiKey`.
- 5xx or transport timeout: two retries (`+200ms`, `+500ms`).
- Other 4xx: no retry.
