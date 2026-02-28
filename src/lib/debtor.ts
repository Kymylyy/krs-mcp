import { encryptRdn } from "./crypto.js";
import { asRecord, asStringOrNull, normalizeRdn } from "./normalize.js";
import type { DebtorDetails, KrsClient } from "./types.js";

export async function getDebtorDetails(client: KrsClient, rdn: string): Promise<DebtorDetails> {
  const normalizedRdn = normalizeRdn(rdn);
  const encryptedRdn = encryptRdn(normalizedRdn, client.config.secretKey);

  const response = await client.wyszukiwarkaPost<Record<string, unknown>>(
    "danerdn",
    { rdn: encryptedRdn },
    { retry401: true }
  );

  return {
    rdn: asStringOrNull(response.numerRDN) ?? normalizedRdn,
    krs: asStringOrNull(response.numerKRS),
    name: asStringOrNull(response.nazwa),
    raw: asRecord(response)
  };
}
