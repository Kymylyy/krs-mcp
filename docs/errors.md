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

## Retry policy
- 401 (`wyszukiwarka` and TERYT basic): one retry with regenerated `apiKey`.
- 5xx or transport timeout: two retries (`+200ms`, `+500ms`).
- Other 4xx: no retry.
