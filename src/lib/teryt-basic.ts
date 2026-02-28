import { KrsValidationError } from "./errors.js";
import { asArray, asRecord, asStringOrNull } from "./normalize.js";
import type { KrsClient, TerytBasicOptions, TerytItem } from "./types.js";

interface RawTerytItem {
  nazwa?: unknown;
  teryt?: unknown;
  [key: string]: unknown;
}

function mapItems(input: unknown): TerytItem[] {
  return asArray<RawTerytItem>(input).map((item) => ({
    name: asStringOrNull(item.nazwa) ?? "",
    teryt: Boolean(item.teryt),
    raw: asRecord(item)
  }));
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

  const response = await client.terytBasicPost<unknown>("Powiaty", {
    teryt: false,
    wojewodztwo: options.voivodeship,
    powiat: options.county ?? ""
  });

  return mapItems(response);
}

export async function listMunicipalities(
  client: KrsClient,
  options: TerytBasicOptions
): Promise<TerytItem[]> {
  if (!options.voivodeship || !options.county) {
    throw new KrsValidationError("voivodeship and county are required");
  }

  const response = await client.terytBasicPost<unknown>("Gminy", {
    teryt: false,
    wojewodztwo: options.voivodeship,
    powiat: options.county,
    gmina: options.municipality ?? ""
  });

  return mapItems(response);
}

export async function listLocalities(
  client: KrsClient,
  options: TerytBasicOptions
): Promise<TerytItem[]> {
  if (!options.voivodeship || !options.county || !options.municipality) {
    throw new KrsValidationError("voivodeship, county and municipality are required");
  }

  const response = await client.terytBasicPost<unknown>("Miejscowosci", {
    teryt: false,
    wojewodztwo: options.voivodeship,
    powiat: options.county,
    gmina: options.municipality,
    miejscowosc: options.locality ?? ""
  });

  return mapItems(response);
}
