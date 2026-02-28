import { describe, expect, it } from "vitest";
import { encryptKrs, encryptRdn, generateApiKey } from "../src/lib/crypto.js";

describe("crypto", () => {
  it("encryptKrs matches known test vector", () => {
    expect(encryptKrs("0000019193")).toBe("fZGtlkGrHlncrLC1VKjtXw==");
  });

  it("encryptRdn pads to 10 digits and encrypts", () => {
    expect(encryptRdn("19193")).toBe("fZGtlkGrHlncrLC1VKjtXw==");
  });

  it("generateApiKey returns 512 digits", () => {
    const key = generateApiKey(new Date("2026-02-28T12:00:00Z"));
    expect(key).toMatch(/^\d{512}$/);
    expect(key.length).toBe(512);
  });
});
