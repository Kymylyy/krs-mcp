import { describe, expect, it, vi } from "vitest";
import { createKrsClient } from "../src/lib/client.js";
import { KrsApiError, KrsNetworkError } from "../src/lib/errors.js";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("client", () => {
  it("officialApiGet returns parsed payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });

    const result = await client.officialApiGet<{ ok: boolean }>("OdpisAktualny/19193?format=json");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once on 401 for wyszukiwarka", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ title: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ done: true }));

    const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });
    const result = await client.wyszukiwarkaPost<{ done: boolean }>("krs", { rejestr: ["P"] });

    expect(result.done).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries 401 even when it happens after a transport retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary network issue"))
      .mockResolvedValueOnce(jsonResponse({ title: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ done: true }));

    const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });
    const result = await client.wyszukiwarkaPost<{ done: boolean }>("krs", { rejestr: ["P"] });

    expect(result.done).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries on 5xx and succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ title: "fail" }, 503))
      .mockResolvedValueOnce(jsonResponse({ title: "fail" }, 502))
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }));

    const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });
    const result = await client.officialApiGet<{ ok: number }>("Biuletyn/2026-02-20");

    expect(result.ok).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws KrsApiError on 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ title: "Not Found" }, 404));
    const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });

    await expect(client.officialApiGet("OdpisAktualny/9999999999")).rejects.toBeInstanceOf(
      KrsApiError
    );
  });

  it("retries network failures with backoff and fails after max retries", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
      const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch });

      const request = client.officialApiGet("Biuletyn/2026-02-20");
      const assertion = expect(request).rejects.toBeInstanceOf(KrsNetworkError);
      await vi.runAllTimersAsync();

      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns timeout-flavored network message for AbortError failures", async () => {
    vi.useFakeTimers();
    try {
      const abortError = new Error("aborted");
      abortError.name = "AbortError";
      const fetchMock = vi.fn().mockRejectedValue(abortError);
      const client = createKrsClient({ fetchImpl: fetchMock as typeof fetch, timeoutMs: 5 });

      const request = client.officialApiGet("Biuletyn/2026-02-20");
      const assertion = expect(request).rejects.toThrow("timed out");
      await vi.runAllTimersAsync();

      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
