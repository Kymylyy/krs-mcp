import { describe, expect, it } from "vitest";
import { KrsValidationError } from "../src/lib/errors.js";
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
      listMunicipalities(makeClient(), { voivodeship: "MAZ" })
    ).rejects.toBeInstanceOf(KrsValidationError);
    await expect(
      listLocalities(makeClient(), { voivodeship: "MAZ", county: "WAW" })
    ).rejects.toBeInstanceOf(KrsValidationError);
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
});
