import { describe, expect, it } from "vitest";
import { KrsApiError, KrsValidationError } from "../src/lib/errors.js";
import {
  listCounties,
  listLocalities,
  listMunicipalities,
  listVoivodeships
} from "../src/lib/teryt-basic.js";
import {
  lookupAdminByCity,
  suggestCities,
  suggestPostalCodes,
  suggestStreets,
  validateAddress
} from "../src/lib/teryt-advanced.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(): KrsClient {
  return {
    config: {} as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => {
      throw new Error("not used");
    },
    terytBasicPost: async () => [
      { nazwa: "MAZOWIECKIE", teryt: true },
      { nazwa: "WARSZAWA", teryt: false }
    ],
    terytAdvancedGet: async (path) => {
      if (path === "DajAdmPoMiasto") {
        return { wojewodztwo: "MAZOWIECKIE" };
      }
      return [{ nazwa: "WARSZAWA", teryt: true }];
    },
    terytAdvancedPost: async () => ({ valid: true })
  };
}

describe("teryt basic", () => {
  it("maps listVoivodeships", async () => {
    const data = await listVoivodeships(makeClient());
    expect(data).toHaveLength(2);
  });

  it("validates missing parent filters", async () => {
    await expect(listCounties(makeClient(), {})).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listCounties(makeClient(), { voivodeship: "MAZ" })
    ).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listMunicipalities(makeClient(), { voivodeship: "MAZ" })
    ).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listMunicipalities(makeClient(), { voivodeship: "MAZ", county: "WAW" })
    ).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listLocalities(makeClient(), { voivodeship: "MAZ", county: "WAW" })
    ).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listLocalities(makeClient(), {
        voivodeship: "MAZ",
        county: "WAW",
        municipality: "WAW"
      })
    ).rejects.toBeInstanceOf(KrsValidationError);
  });

  it("remaps 404 to validation errors for exact-match endpoints", async () => {
    const notFoundClient: KrsClient = {
      ...makeClient(),
      terytBasicPost: async () => {
        throw new KrsApiError("Not Found", 404, "https://example.invalid");
      }
    };

    await expect(
      listCounties(notFoundClient, { voivodeship: "MAZOWIECKIE", county: "WARSZAWA" })
    ).rejects.toThrow("No matches for county");
    await expect(
      listMunicipalities(notFoundClient, {
        voivodeship: "MAZOWIECKIE",
        county: "WARSZAWA",
        municipality: "WARSZAWA"
      })
    ).rejects.toThrow("No matches for municipality");
    await expect(
      listLocalities(notFoundClient, {
        voivodeship: "MAZOWIECKIE",
        county: "WARSZAWA",
        municipality: "WARSZAWA",
        locality: "WARSZAWA"
      })
    ).rejects.toThrow("No matches for locality");
  });
});

describe("teryt advanced", () => {
  it("maps city and street suggestions", async () => {
    const cities = await suggestCities(makeClient(), { query: "WAR" });
    const streets = await suggestStreets(makeClient(), { query: "MARS" });
    const postal = await suggestPostalCodes(makeClient(), { locality: "WARSZAWA" });

    expect(cities[0]?.label).toBe("WARSZAWA");
    expect(streets[0]?.label).toBe("WARSZAWA");
    expect(postal[0]?.label).toBe("WARSZAWA");
  });

  it("returns admin lookup and address validation", async () => {
    const lookup = await lookupAdminByCity(makeClient(), "WARSZAWA");
    const check = await validateAddress(makeClient(), { locality: "WARSZAWA" });

    expect(lookup.city).toBe("WARSZAWA");
    expect(check.valid).toBe(true);
  });

  it("remaps 503 to clear temporary-unavailable message", async () => {
    const unavailableClient: KrsClient = {
      ...makeClient(),
      terytAdvancedGet: async () => {
        throw new KrsApiError(
          "Request failed with HTTP 503",
          503,
          "https://example.invalid/GetCities"
        );
      },
      terytAdvancedPost: async () => {
        throw new KrsApiError(
          "Request failed with HTTP 503",
          503,
          "https://example.invalid/CheckAdress"
        );
      }
    };

    await expect(suggestCities(unavailableClient, { query: "WAR" })).rejects.toThrow(
      "TERYT advanced service is temporarily unavailable"
    );
    await expect(suggestStreets(unavailableClient, { query: "MARS" })).rejects.toThrow(
      "TERYT advanced service is temporarily unavailable"
    );
    await expect(
      suggestPostalCodes(unavailableClient, { locality: "WARSZAWA" })
    ).rejects.toThrow("TERYT advanced service is temporarily unavailable");
    await expect(lookupAdminByCity(unavailableClient, "WARSZAWA")).rejects.toThrow(
      "TERYT advanced service is temporarily unavailable"
    );
    await expect(validateAddress(unavailableClient, { locality: "WARSZAWA" })).rejects.toThrow(
      "TERYT advanced service is temporarily unavailable"
    );
  });
});
