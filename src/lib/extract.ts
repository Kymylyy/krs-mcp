import { KrsValidationError } from "./errors.js";
import { normalizeKrs } from "./normalize.js";
import type { EntityExtractOptions, EntityExtractResult, KrsClient } from "./types.js";

function buildOfficialPath(
  normalizedKrs: string,
  options: Required<Pick<EntityExtractOptions, "type">> & Pick<EntityExtractOptions, "register">
): string {
  const endpoint = options.type === "full" ? "OdpisPelny" : "OdpisAktualny";
  const query = new URLSearchParams();

  if (options.register) {
    query.set("rejestr", options.register);
  }
  query.set("format", "json");

  return `${endpoint}/${normalizedKrs}?${query.toString()}`;
}

export async function getEntityExtract(
  client: KrsClient,
  krs: string,
  options: EntityExtractOptions = {}
): Promise<EntityExtractResult> {
  const normalizedKrs = normalizeKrs(krs);
  const type = options.type ?? "current";

  if (type !== "current" && type !== "full") {
    throw new KrsValidationError("type must be 'current' or 'full'");
  }

  const path = buildOfficialPath(normalizedKrs, {
    type,
    register: options.register
  });

  const data = await client.officialApiGet<Record<string, unknown>>(path);

  return {
    krs: normalizedKrs,
    register: options.register ?? null,
    type,
    data
  };
}
