import { describe, expect, it } from "vitest";
import { searchEntities } from "../src/lib/search.js";
import { KrsValidationError } from "../src/lib/errors.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(response: unknown): KrsClient {
  return {
    config: {} as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => response,
    terytBasicPost: async () => {
      throw new Error("not used");
    },
    terytAdvancedGet: async () => {
      throw new Error("not used");
    },
    terytAdvancedPost: async () => {
      throw new Error("not used");
    }
  };
}

describe("searchEntities", () => {
  it("maps and pads KRS numbers", async () => {
    const client = makeClient({
      liczbaPodmiotow: 1,
      listaPodmiotow: [
        {
          numer: "19193",
          nazwa: "TEST",
          miejscowosc: "WARSZAWA",
          typRejestru: "P",
          czyOPP: false,
          czyUpadlosc: false
        }
      ]
    });

    const result = await searchEntities(client, { name: "TEST" });

    expect(result.total).toBe(1);
    expect(result.entities[0]?.krs).toBe("0000019193");
  });

  it("rejects empty criteria", async () => {
    await expect(searchEntities(makeClient({}), {})).rejects.toBeInstanceOf(KrsValidationError);
  });

  it("rejects mixed identifier and name filters", async () => {
    await expect(searchEntities(makeClient({}), { krs: "19193", name: "PKP" })).rejects.toBeInstanceOf(
      KrsValidationError
    );
  });
});
