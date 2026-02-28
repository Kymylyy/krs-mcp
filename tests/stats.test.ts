import { describe, expect, it } from "vitest";
import { getRegistryStats } from "../src/lib/stats.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(total: number): KrsClient {
  return {
    config: {} as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => ({ liczbaPodmiotow: total, listaPodmiotow: [] }),
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

describe("getRegistryStats", () => {
  it("returns total from search", async () => {
    const stats = await getRegistryStats(makeClient(1204068), { name: "PKP" });
    expect(stats.total).toBe(1204068);
  });
});
