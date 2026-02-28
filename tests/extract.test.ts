import { describe, expect, it } from "vitest";
import { getEntityExtract } from "../src/lib/extract.js";
import type { KrsClient } from "../src/lib/types.js";

function makeClient(calls: string[]): KrsClient {
  return {
    config: {} as any,
    officialApiGet: async (path) => {
      calls.push(path);
      return { odpis: {} };
    },
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

describe("getEntityExtract", () => {
  it("calls official endpoint with expected path", async () => {
    const calls: string[] = [];
    const result = await getEntityExtract(makeClient(calls), "19193", {
      register: "P",
      type: "current"
    });

    expect(result.krs).toBe("0000019193");
    expect(calls[0]).toContain("OdpisAktualny/0000019193");
    expect(calls[0]).toContain("rejestr=P");
  });
});
