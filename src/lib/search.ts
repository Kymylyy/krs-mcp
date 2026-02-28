import { KrsValidationError } from "./errors.js";
import { ensureDigits, normalizeKrs, stripLeadingZeros } from "./normalize.js";
import type {
  KrsClient,
  RegisterType,
  SearchEntity,
  SearchOptions,
  SearchResult
} from "./types.js";
import { z } from "zod";

interface SearchApiRecord {
  czyOPP?: boolean;
  czyUpadlosc?: boolean;
  miejscowosc?: string;
  nazwa?: string;
  numer?: string;
  typRejestru?: RegisterType;
  [key: string]: unknown;
}

interface SearchApiResponse {
  liczbaPodmiotow?: number;
  listaPodmiotow?: SearchApiRecord[];
}

const searchApiRecordSchema = z
  .object({
    czyOPP: z.boolean().optional(),
    czyUpadlosc: z.boolean().optional(),
    miejscowosc: z.string().optional(),
    nazwa: z.string().optional(),
    numer: z.string().optional(),
    typRejestru: z.enum(["P", "S"]).optional()
  })
  .passthrough();

const searchApiResponseSchema = z
  .object({
    liczbaPodmiotow: z.number().optional(),
    listaPodmiotow: z.array(searchApiRecordSchema).optional()
  })
  .passthrough();

function toRegisterArray(register: SearchOptions["register"]): RegisterType[] {
  if (!register || register === "both") {
    return ["P", "S"];
  }
  return [register];
}

function validateName(name: string, exactName: boolean): void {
  const alnumMatches = name.match(/[\p{L}\p{N}]/gu) ?? [];
  if (!exactName && alnumMatches.length < 3) {
    throw new KrsValidationError(
      "name must contain at least 3 alphanumeric characters for partial search"
    );
  }
}

function validateInput(input: SearchOptions): void {
  const hasIdentifier = Boolean(input.krs || input.nip || input.regon);
  const hasAdvanced = Boolean(
    input.name ||
      input.city ||
      input.county ||
      input.municipality ||
      input.voivodeship
  );

  if (!hasIdentifier && !hasAdvanced) {
    throw new KrsValidationError("At least one search criterion is required");
  }

  if (hasIdentifier && hasAdvanced) {
    throw new KrsValidationError(
      "krs/nip/regon cannot be combined with name or location filters"
    );
  }

  if (input.krs) {
    normalizeKrs(input.krs);
  }

  if (input.nip) {
    const nip = ensureDigits(input.nip, "NIP");
    if (nip.length !== 10) {
      throw new KrsValidationError("NIP must be exactly 10 digits");
    }
  }

  if (input.regon) {
    const regon = ensureDigits(input.regon, "REGON");
    if (regon.length !== 9 && regon.length !== 14) {
      throw new KrsValidationError("REGON must be 9 or 14 digits");
    }
  }

  if (input.name) {
    validateName(input.name, input.exact_name ?? false);
  }

  if (input.limit !== undefined && (input.limit < 1 || input.limit > 100)) {
    throw new KrsValidationError("limit must be between 1 and 100");
  }

  if (input.page !== undefined && input.page < 1) {
    throw new KrsValidationError("page must be >= 1");
  }
}

function mapSearchRecord(record: SearchApiRecord): SearchEntity | null {
  const numer = typeof record.numer === "string" ? record.numer : "";
  const digits = numer.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 10) {
    return null;
  }

  return {
    krs: digits.padStart(10, "0"),
    name: typeof record.nazwa === "string" ? record.nazwa : "",
    city: typeof record.miejscowosc === "string" ? record.miejscowosc : null,
    register: record.typRejestru === "S" ? "S" : "P",
    opp: Boolean(record.czyOPP),
    bankruptcy: Boolean(record.czyUpadlosc),
    raw: record
  };
}

export async function searchEntities(
  client: KrsClient,
  options: SearchOptions
): Promise<SearchResult> {
  validateInput(options);

  const limit = options.limit ?? 10;
  const page = options.page ?? 1;

  const body = {
    rejestr: toRegisterArray(options.register),
    podmiot: {
      krs: options.krs ? stripLeadingZeros(options.krs) : null,
      nip: options.nip ?? null,
      regon: options.regon ?? null,
      nazwa: options.name ?? null,
      wojewodztwo: options.voivodeship ?? null,
      powiat: options.county ?? null,
      gmina: options.municipality ?? null,
      miejscowosc: options.city ?? null,
      dokladnaNazwa: options.exact_name ?? false
    },
    status: {
      czyOpp: options.opp_only ?? null,
      czyWpisDotyczacyPostepowaniaUpadlosciowego: options.bankruptcy_only ?? null,
      dataPrzyznaniaStatutuOppOd: null,
      dataPrzyznaniaStatutuOppDo: null
    },
    paginacja: {
      liczbaElementowNaStronie: limit,
      maksymalnaLiczbaWynikow: Math.max(100, limit),
      numerStrony: page
    }
  };

  const rawResponse = await client.wyszukiwarkaPost<unknown>("krs", body);
  const response: SearchApiResponse = searchApiResponseSchema.parse(rawResponse);
  const entities = (response.listaPodmiotow ?? [])
    .map(mapSearchRecord)
    .filter((item): item is SearchEntity => item !== null);

  return {
    total: typeof response.liczbaPodmiotow === "number" ? response.liczbaPodmiotow : 0,
    page,
    limit,
    entities
  };
}
