import { describe, expect, it } from "vitest";
import { getEntityBoard } from "../src/lib/board.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(): KrsClient {
  return {
    config: { secretKey: "TopSecretApiKey1" } as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => ({
      numerKRS: "0000019193",
      nazwa: "PKP",
      nazwaOrganuRep: "ZARZĄD",
      sposobRep: "ŁĄCZNA",
      listaCzlonkowReprezentacji: [
        { funkcja: "PREZES", imiePierwsze: "ALAN", nazwisko: "BEROUD", nazwa: null }
      ]
    }),
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

describe("getEntityBoard", () => {
  it("returns board-only projection", async () => {
    const result = await getEntityBoard(makeClient(), "19193");
    expect(result.entityName).toBe("PKP");
    expect(result.members).toHaveLength(1);
  });
});
