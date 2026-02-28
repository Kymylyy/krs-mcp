import { encryptRdn } from "./crypto.js";
import { asRecord, asStringOrNull, normalizeRdn } from "./normalize.js";
import type { DebtorDetails, KrsClient } from "./types.js";
import { z } from "zod";

const debtorResponseSchema = z
  .object({
    numerRDN: z.unknown().optional(),
    numerKRS: z.unknown().optional(),
    nazwa: z.unknown().optional()
  })
  .passthrough();

export async function getDebtorDetails(client: KrsClient, rdn: string): Promise<DebtorDetails> {
  const normalizedRdn = normalizeRdn(rdn);
  const encryptedRdn = encryptRdn(normalizedRdn, client.config.secretKey);

  const rawResponse = await client.wyszukiwarkaPost<unknown>(
    "danerdn",
    { rdn: encryptedRdn },
    { retry401: true }
  );
  const response = debtorResponseSchema.parse(rawResponse);

  return {
    rdn: asStringOrNull(response.numerRDN) ?? normalizedRdn,
    krs: asStringOrNull(response.numerKRS),
    name: asStringOrNull(response.nazwa),
    raw: asRecord(response)
  };
}
