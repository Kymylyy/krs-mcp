import { KrsApiError, KrsValidationError } from "./errors.js";
import { asArray, asRecord, asStringOrNull } from "./normalize.js";
import type {
  AddressValidationInput,
  AddressValidationResult,
  AdminByCityResult,
  KrsClient,
  SuggestCitiesOptions,
  SuggestPostalCodesOptions,
  SuggestStreetsOptions,
  TerytSuggestion
} from "./types.js";
import { z } from "zod";

const suggestionItemSchema = z.record(z.unknown());
const suggestionListSchema = z.array(suggestionItemSchema);

function requireQuery(value: string, label: string): void {
  if (!value.trim()) {
    throw new KrsValidationError(`${label} must not be empty`);
  }
}

function mapSuggestions(data: unknown): TerytSuggestion[] {
  return asArray<Record<string, unknown>>(suggestionListSchema.parse(data)).map((item) => {
    const label =
      asStringOrNull(item.nazwa) ??
      asStringOrNull(item.value) ??
      asStringOrNull(item.label) ??
      asStringOrNull(item.kodPocztowy) ??
      "";

    return {
      label,
      highlight: Boolean(item.teryt),
      raw: asRecord(item)
    };
  });
}

function remapTerytAdvancedUnavailable(error: unknown): never {
  if (error instanceof KrsApiError && error.statusCode === 503) {
    throw new KrsApiError(
      "TERYT advanced service is temporarily unavailable",
      error.statusCode,
      error.url,
      error.details
    );
  }

  throw error;
}

export async function suggestCities(
  client: KrsClient,
  options: SuggestCitiesOptions
): Promise<TerytSuggestion[]> {
  requireQuery(options.query, "query");

  try {
    const result = await client.terytAdvancedGet<unknown>("GetCities", {
      Miejscowosc: options.query,
      Wojewodztwo: options.voivodeship ?? "",
      Powiat: options.county ?? "",
      Gmina: options.municipality ?? ""
    });

    return mapSuggestions(result);
  } catch (error) {
    remapTerytAdvancedUnavailable(error);
  }
}

export async function suggestStreets(
  client: KrsClient,
  options: SuggestStreetsOptions
): Promise<TerytSuggestion[]> {
  requireQuery(options.query, "query");

  try {
    const result = await client.terytAdvancedGet<unknown>("GetStreets", {
      Ulica: options.query,
      Wojewodztwo: options.voivodeship ?? "",
      Powiat: options.county ?? "",
      Gmina: options.municipality ?? "",
      Miejscowosc: options.locality ?? ""
    });

    return mapSuggestions(result);
  } catch (error) {
    remapTerytAdvancedUnavailable(error);
  }
}

export async function suggestPostalCodes(
  client: KrsClient,
  options: SuggestPostalCodesOptions
): Promise<TerytSuggestion[]> {
  requireQuery(options.locality, "locality");

  try {
    const result = await client.terytAdvancedGet<unknown>("GetPostalCodes", {
      Miejscowosc: options.locality,
      Ulica: options.street ?? ""
    });

    return mapSuggestions(result);
  } catch (error) {
    remapTerytAdvancedUnavailable(error);
  }
}

export async function lookupAdminByCity(
  client: KrsClient,
  city: string
): Promise<AdminByCityResult> {
  requireQuery(city, "city");

  try {
    const result = await client.terytAdvancedGet<unknown>("DajAdmPoMiasto", {
      city
    });

    return {
      city,
      raw: result
    };
  } catch (error) {
    remapTerytAdvancedUnavailable(error);
  }
}

export async function validateAddress(
  client: KrsClient,
  input: AddressValidationInput
): Promise<AddressValidationResult> {
  try {
    const result = await client.terytAdvancedPost<unknown>("CheckAdress", input);

    const object = asRecord(result);
    const possibleValidity = object.valid ?? object.isValid ?? object.czyPoprawny ?? null;

    return {
      valid: typeof possibleValidity === "boolean" ? possibleValidity : null,
      raw: result
    };
  } catch (error) {
    remapTerytAdvancedUnavailable(error);
  }
}
