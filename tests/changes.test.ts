import { describe, expect, it } from "vitest";
import { getRegistryChanges } from "../src/lib/changes.js";
import { KrsValidationError } from "../src/lib/errors.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(values: string[]): KrsClient {
  return {
    config: {} as any,
    officialApiGet: async () => values,
    wyszukiwarkaPost: async () => {
      throw new Error("not used");
    },
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

describe("getRegistryChanges", () => {
  it("deduplicates and zero-pads KRS numbers", async () => {
    const result = await getRegistryChanges(makeClient(["2714", "2714", "3494"]), "2026-02-20");

    expect(result.count).toBe(2);
    expect(result.krsNumbers).toEqual(["0000002714", "0000003494"]);
  });

  it("validates hour pair", async () => {
    await expect(
      getRegistryChanges(makeClient([]), "2026-02-20", { hourFrom: 1 })
    ).rejects.toBeInstanceOf(KrsValidationError);
  });
});
