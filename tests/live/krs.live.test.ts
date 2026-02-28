import { beforeAll, describe, expect, it } from "vitest";
import {
  createKrsClient,
  getEntityDetails,
  getEntityExtract,
  getRegistryChanges,
  searchEntities
} from "../../src/lib/index.js";

const runLive = process.env.KRS_LIVE_TESTS === "1";
const describeLive = runLive ? describe : describe.skip;

describeLive("live KRS API", () => {
  const client = createKrsClient();
  let testKrs = "0000019193";

  beforeAll(async () => {
    const search = await searchEntities(client, { krs: "19193", limit: 1, page: 1 });
    const candidate = search.entities[0]?.krs;
    if (candidate) {
      testKrs = candidate;
    }
  });

  it("search_entities returns at least one match", async () => {
    const result = await searchEntities(client, { name: "POLSKIE KOLEJE", limit: 5, page: 1 });
    expect(result.total).toBeGreaterThan(0);
  });

  it("get_entity_details returns board members", async () => {
    const details = await getEntityDetails(client, testKrs);
    expect(details.krs).toBe(testKrs);
    expect(Array.isArray(details.boardMembers)).toBe(true);
  });

  it("get_entity_extract returns current and full payloads", async () => {
    const current = await getEntityExtract(client, testKrs, { type: "current" });
    const full = await getEntityExtract(client, testKrs, { type: "full" });

    expect(current.type).toBe("current");
    expect(full.type).toBe("full");
  });

  it("get_registry_changes returns a list", async () => {
    const changes = await getRegistryChanges(client, "2026-02-20");
    expect(Array.isArray(changes.krsNumbers)).toBe(true);
  });
});
