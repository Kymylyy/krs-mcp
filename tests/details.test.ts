import { describe, expect, it } from "vitest";
import { getEntityDetails } from "../src/lib/details.js";
import type { KrsClient } from "../src/lib/types.js";

const detailsResponse = {
  numerKRS: "0000019193",
  nazwa: "POLSKIE KOLEJE",
  formaPrawna: "SPÓŁKA AKCYJNA",
  nip: "5250000251",
  regon: "00012680100000",
  nazwaOrganuRep: "ZARZĄD",
  sposobRep: "ŁĄCZNA",
  listaCzlonkowReprezentacji: [
    {
      funkcja: "PREZES ZARZĄDU",
      imiePierwsze: "ALAN",
      imieDrugie: "MARCIN",
      nazwisko: "BEROUD",
      nazwiskoDrugiCzlon: "",
      nazwa: null
    }
  ]
};

function makeClient(): KrsClient {
  return {
    config: {
      secretKey: "TopSecretApiKey1"
    } as any,
    officialApiGet: async () => {
      throw new Error("not used");
    },
    wyszukiwarkaPost: async () => detailsResponse,
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

describe("getEntityDetails", () => {
  it("maps board members", async () => {
    const result = await getEntityDetails(makeClient(), "19193");
    expect(result.krs).toBe("0000019193");
    expect(result.boardMembers).toHaveLength(1);
    expect(result.boardMembers[0]?.lastName).toBe("BEROUD");
  });
});
