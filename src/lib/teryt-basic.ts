import { KrsApiError, KrsValidationError } from "./errors.js";
import { asArray, asRecord, asStringOrNull } from "./normalize.js";
import type { KrsClient, TerytBasicOptions, TerytItem } from "./types.js";
import { z } from "zod";

interface RawTerytItem {
  nazwa?: unknown;
  teryt?: unknown;
  [key: string]: unknown;
}

const terytItemSchema = z
  .object({
    nazwa: z.unknown().optional(),
    teryt: z.unknown().optional()
  })
  .passthrough();

const terytListSchema = z.array(terytItemSchema);

function mapItems(input: unknown): TerytItem[] {
  return asArray<RawTerytItem>(terytListSchema.parse(input)).map((item) => ({
    name: asStringOrNull(item.nazwa) ?? "",
    teryt: Boolean(item.teryt),
    raw: asRecord(item)
  }));
}

function requireExactFilter(value: string | undefined, label: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    throw new KrsValidationError(
      `${label} filter is required for this endpoint and should be an exact value`
    );
  }
  return normalized;
}

function remapNotFound(error: unknown, label: string): never {
  if (error instanceof KrsApiError && error.statusCode === 404) {
    throw new KrsValidationError(
      `No matches for ${label}; upstream endpoint expects an exact value from previous step`
    );
  }

  throw error;
}

export async function listVoivodeships(
  client: KrsClient,
  options: { query?: string } = {}
): Promise<TerytItem[]> {
  const response = await client.terytBasicPost<unknown>("Wojewodztwa", {
    teryt: false,
    wojewodztwo: options.query ?? "j"
  });

  return mapItems(response);
}

export async function listCounties(
  client: KrsClient,
  options: TerytBasicOptions
): Promise<TerytItem[]> {
  if (!options.voivodeship) {
    throw new KrsValidationError("voivodeship is required");
  }

  const county = requireExactFilter(options.county, "county");

  try {
    const response = await client.terytBasicPost<unknown>("Powiaty", {
      teryt: false,
      wojewodztwo: options.voivodeship,
      powiat: county
    });

    return mapItems(response);
  } catch (error) {
    remapNotFound(error, "county");
  }
}

export async function listMunicipalities(
  client: KrsClient,
  options: TerytBasicOptions
): Promise<TerytItem[]> {
  if (!options.voivodeship || !options.county) {
    throw new KrsValidationError("voivodeship and county are required");
  }

  const municipality = requireExactFilter(options.municipality, "municipality");

  try {
    const response = await client.terytBasicPost<unknown>("Gminy", {
      teryt: false,
      wojewodztwo: options.voivodeship,
      powiat: options.county,
      gmina: municipality
    });

    return mapItems(response);
  } catch (error) {
    remapNotFound(error, "municipality");
  }
}

export async function listLocalities(
  client: KrsClient,
  options: TerytBasicOptions
): Promise<TerytItem[]> {
  if (!options.voivodeship || !options.county || !options.municipality) {
    throw new KrsValidationError("voivodeship, county and municipality are required");
  }

  const locality = requireExactFilter(options.locality, "locality");

  try {
    const response = await client.terytBasicPost<unknown>("Miejscowosci", {
      teryt: false,
      wojewodztwo: options.voivodeship,
      powiat: options.county,
      gmina: options.municipality,
      miejscowosc: locality
    });

    return mapItems(response);
  } catch (error) {
    remapNotFound(error, "locality");
  }
}
