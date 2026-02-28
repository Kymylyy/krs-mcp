import { describe, expect, it } from "vitest";
import { getDebtorDetails } from "../src/lib/debtor.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(): KrsClient {
  return {
    config: { secretKey: "TopSecretApiKey1" } as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => ({
      numerRDN: "0000001234",
      numerKRS: "0000019193",
      nazwa: "TEST ENTITY"
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

describe("getDebtorDetails", () => {
  it("maps debtor payload", async () => {
    const result = await getDebtorDetails(makeClient(), "1234");
    expect(result.rdn).toBe("0000001234");
    expect(result.krs).toBe("0000019193");
    expect(result.name).toBe("TEST ENTITY");
  });
});
